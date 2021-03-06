import {
	ExceptionFilter,
	Catch,
	ArgumentsHost,
	HttpException,
	UnauthorizedException,
	ForbiddenException,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(HttpException)
  export class UrlGeneratorFilter implements ExceptionFilter {
	catch(exception: HttpException, host: ArgumentsHost) {
	  const ctx = host.switchToHttp();
	  const response = ctx.getResponse<Response>();
  
	  if (exception instanceof UnauthorizedException
		|| exception instanceof ForbiddenException) {
		response.redirect(process.env.FRONTEND + '/forbiddenres');
	  } else {
		response.redirect(process.env.FRONTEND + '/thechat');
	  }
	}
  }
  