import { Controller, Get, Param, Res } from '@nestjs/common';
import { ViewsService } from './views.service';
import type { Response } from 'express';

export function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

@Controller()
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  // ── Public ────────────────────────────────────────────────────────────

  @Get('invoice/:id')
  landing(@Param(':id') id: string, @Res() res: Response) {
    res.render('invoice.njk', { id });
  }
}
