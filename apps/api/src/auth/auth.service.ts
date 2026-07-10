import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  RegisterDto,
  LoginDto,
  UpdateDto,
  TotpVerifyDto,
} from './dto/user.dto';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import { User } from './schemas/user.schema';
import { StatusResponseDto } from './dto/auth-response.dto';
import { TotpService } from './totp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly totpService: TotpService,
  ) {}

  async status(): Promise<StatusResponseDto> {
    const registered = await this.userModel.findOne({ isValid: true });

    return { registered: Boolean(registered) };
  }

  async me(sub: string) {
    const user = await this.userModel.findOne({
      _id: new Types.ObjectId(sub),
      isValid: true,
    });

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    return user;
  }

  async register(registerDto: RegisterDto): Promise<void> {
    await this.userModel.deleteMany({ isValid: false });

    const adminExists = await this.userModel.countDocuments({ isValid: true });
    if (adminExists > 0) {
      throw new ForbiddenException('Admin user already registered');
    }

    const hashedPassword = await argon2.hash(registerDto.password);
    await this.userModel.create({
      email: registerDto.email,
      password: hashedPassword,
    });
  }

  async verifyTotp(dto: TotpVerifyDto): Promise<string> {
    const user = await this.totpService.verify(
      dto.email,
      dto.password,
      dto.token,
    );

    if (!user) {
      throw new ForbiddenException('Unable to verify user');
    }

    return this.generateToken(user);
  }

  async login(loginDto: LoginDto): Promise<string> {
    const user = await this.validateUser(loginDto);

    const totpValid = await this.totpService.validateTotp(
      user._id.toString(),
      loginDto.token,
    );

    if (!totpValid) {
      throw new UnauthorizedException('Invalid TOTP code');
    }

    return this.generateToken(user);
  }

  async update(sub: string, updateDto: UpdateDto) {
    const user = await this.userModel
      .findById({ _id: new Types.ObjectId(sub) })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('User not registered');
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      updateDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const updates: Partial<{ email: string; password: string }> = {};

    if (updateDto.email !== user.email) {
      updates.email = updateDto.email;
    }

    if (updateDto.newPassword) {
      updates.password = await argon2.hash(updateDto.newPassword);
    }

    await this.userModel.findByIdAndUpdate(
      { _id: new Types.ObjectId(sub) },
      updates,
    );

    return { email: updates.email ?? user.email };
  }

  async validateUser(loginDto: LoginDto): Promise<User> {
    const user = await this.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isValid) {
      throw new UnauthorizedException('Account setup incomplete');
    }

    return user;
  }

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user._id.toString() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(new Types.ObjectId(id));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email, isValid: true }).select('+password');
  }
}
