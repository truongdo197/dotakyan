import { NextFunction, Request, Response, Router } from 'express';
import { checkPermission, checkTokenCms } from '$middlewares/cms';
import { checkTokenApp } from '$middlewares/app';
import log from '$helpers/log';
import { done, ErrorHandlerController } from './response';
import { Permissions } from '$enums/common';

/**
 * Decorator route for express
 */
export const RootRoute = Router();

enum RequestMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  OPTIONS = 'options',
  HEAD = 'head',
}

interface RouteInterface {
  path: string;
  method: RequestMethod;
  middlewares: Function[];
  propertyKey: string;
}

interface PermissionsInterface {
  propertyKey: string;
  permissions: Permissions[];
}

interface MiddlewareCallback {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

export const CMS = (routePrefix: string, version: string = '/cms'): ClassDecorator => {
  return (targetClass: any) => {
    handleClassDecorator(targetClass, routePrefix, version, checkTokenCms);
  };
};

export const APP = (routePrefix: string, version: string = ''): ClassDecorator => {
  return (targetClass: any) => {
    handleClassDecorator(targetClass, routePrefix, version, checkTokenApp);
  };
};

export const Method = (path: string, middlewares: Function[], method: RequestMethod): MethodDecorator => {
  return (target: ClassDecorator, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!Reflect.hasOwnMetadata('routes', target.constructor)) {
      Reflect.defineMetadata('routes', [], target.constructor);
    }
    const routes: RouteInterface[] = Reflect.getMetadata('routes', target.constructor);
    routes.push({
      path,
      method,
      middlewares,
      propertyKey,
    });
    Reflect.defineMetadata('routes', routes, target.constructor);
  };
};

export const Get = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.GET);
};

export const Post = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.POST);
};

export const Put = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.PUT);
};

export const Delete = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.DELETE);
};

export const Options = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.OPTIONS);
};

export const Head = (path: string, middlewares?: Function[]): MethodDecorator => {
  return Method(path, middlewares, RequestMethod.HEAD);
};

export function catchError(callback: MiddlewareCallback, className: String) {
  const logger = log(className);
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = (await callback(req, res, next)) as any;
      if (result && result.isDone === true) return;
      return done(res, result);
    } catch (error) {
      next(new ErrorHandlerController(error, logger));
    }
  };
}

function handleClassDecorator(targetClass: any, routePrefix: string, version: string, defaultMiddleware: Function) {
  if (!Reflect.hasOwnMetadata('routes', targetClass)) {
    Reflect.defineMetadata('routes', [], targetClass);
  }

  if (!Reflect.hasOwnMetadata('routePermissions', targetClass)) {
    Reflect.defineMetadata('routePermissions', [], targetClass);
  }

  const rootPath = version + routePrefix;
  const instance = new targetClass();

  const routePermissions: PermissionsInterface[] = Reflect.getMetadata('routePermissions', targetClass);
  const routes = Reflect.getMetadata('routes', targetClass) as RouteInterface[];

  routes.forEach((route: RouteInterface) => {
    route.middlewares = route.middlewares ? route.middlewares : [defaultMiddleware];

    route.middlewares = route.middlewares ? route.middlewares : [defaultMiddleware];
    const routePermission = routePermissions.find((item) => item.propertyKey === route.propertyKey);

    if (routePermission) {
      route.middlewares.push(checkPermission(routePermission.permissions));
    }
    (RootRoute as any)[route.method](
      rootPath + route.path,
      route.middlewares,
      catchError(instance[route.propertyKey], targetClass.name)
    );
  });
}

export const RequirePermission = (permissions: Permissions[]): MethodDecorator => {
  return (target: ClassDecorator, propertyKey: string, descriptor: PropertyDescriptor) => {
    if (!Reflect.hasOwnMetadata('routePermissions', target.constructor)) {
      Reflect.defineMetadata('routePermissions', [], target.constructor);
    }

    const routePermissions: PermissionsInterface[] = Reflect.getMetadata('routePermissions', target.constructor);
    let routePermission = routePermissions.find((item) => item.propertyKey === propertyKey);

    if (!routePermission)
      routePermission = {
        propertyKey,
        permissions: [],
      };

    routePermission.permissions.push(...permissions);
    routePermissions.push(routePermission);

    Reflect.defineMetadata('routePermissions', routePermissions, target.constructor);
  };
};
