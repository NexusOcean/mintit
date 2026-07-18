import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ViewsService } from './views.service';

@Controller()
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Get('i/:publicId')
  async landing(@Param('publicId') publicId: string, @Res() res: Response) {
    const invoice = await this.viewsService.getInvoice(publicId);
    if (!invoice) {
      throw new NotFoundException();
    }
    res.render('invoice.njk', { invoice });
  }

  @Get('i/:publicId/status')
  async status(@Param('publicId') publicId: string) {
    const status = await this.viewsService.getStatus(publicId);
    if (!status) {
      throw new NotFoundException();
    }
    return status;
  }
}
