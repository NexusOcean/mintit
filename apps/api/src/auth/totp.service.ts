import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TOTP } from '@otplib/totp';
import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
import * as qrcode from 'qrcode';
import * as argon2 from 'argon2';
import { User } from './schemas/user.schema';

@Injectable()
export class TotpService {
  private readonly totp = new TOTP({
    crypto: new NodeCryptoPlugin(),
    base32: new ScureBase32Plugin(),
  });

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async setup(
    email: string,
    password: string,
  ): Promise<{ qrCode: string; secret: string; backupCodes: string[] }> {
    const user = await this.userModel.findOne({ email }).select('+password');

    if (!user || !(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const secret = this.totp.generateSecret();
    const otpAuthUrl = this.totp.toURI({
      label: email,
      issuer: 'mintit',
      secret,
    });
    const qrCode = await qrcode.toDataURL(otpAuthUrl);
    const backupCodes = this.generateBackupCodes();

    await this.userModel.findByIdAndUpdate(user._id, {
      totpSecret: secret,
      backupCodes,
    });

    return { qrCode, secret, backupCodes };
  }

  async verify(
    email: string,
    password: string,
    token: string,
  ): Promise<User | null> {
    const user = await this.userModel
      .findOne({ email })
      .select('+password +totpSecret');

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    if (!user.totpSecret) throw new UnauthorizedException('TOTP not setup');

    const result = await this.totp.verify(token, { secret: user.totpSecret });
    if (!result.valid) throw new UnauthorizedException('Invalid TOTP code');

    return await this.userModel.findByIdAndUpdate(
      user._id,
      { isValid: true },
      { returnDocument: 'after' },
    );
  }

  async validateTotp(userId: string, token: string): Promise<boolean> {
    const user = await this.userModel
      .findById(userId)
      .select('+totpSecret +backupCodes +lastUsedTotp');

    if (!user?.totpSecret) return false;
    console.log(token);

    console.log(user.lastUsedTotp);
    if (user.lastUsedTotp === token) {
      return false;
    }

    const result = await this.totp.verify(token, { secret: user.totpSecret });

    if (result.valid) {
      await this.userModel.findByIdAndUpdate(userId, { lastUsedTotp: token });
      return true;
    }

    const codeIndex = user.backupCodes.indexOf(token);
    if (codeIndex !== -1) {
      user.backupCodes.splice(codeIndex, 1);
      await user.save();
      return true;
    }

    return false;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: 10 }, () =>
      Math.random().toString(36).slice(2, 10).toUpperCase(),
    );
  }
}
