import {CanActivate, ExecutionContext} from '@nestjs/common';
import {Request} from 'express';
import {QtumError} from './QtumError';
import {QTUM_HEADER_ENDPOINT} from './index';

export class QtumEndpointGuard implements CanActivate {
    public canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<Request>();
        if (request.header(QTUM_HEADER_ENDPOINT)?.length) {
            return true;
        }
        throw new QtumError(`Http header ${QTUM_HEADER_ENDPOINT} not present.`, 'header.missing', 400)
    }
}
