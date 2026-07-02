import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  @Get()
  healthCheck() {
    const now = new Date();
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      status: 'ok!',
      uptime: `${hours}h ${minutes}m ${seconds}s`,
      timestamp: now.toLocaleTimeString([], {
        hour12: true,
      }),
    };
  }
}
