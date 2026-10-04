import Router from '@koa/router';
import listRouter from './lists';
import createRouter from './create';
import deleteRouter from './delete';

const router = new Router();

// List books route
router.use(listRouter.routes());
router.use(listRouter.allowedMethods());

// Create and update book routes
router.use(createRouter.routes());
router.use(createRouter.allowedMethods());

// Delete book route
router.use(deleteRouter.routes());
router.use(deleteRouter.allowedMethods());

export default router;
