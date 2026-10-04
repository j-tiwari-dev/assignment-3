import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db';

const deleteRouter = new Router();

// Delete a book by ID
deleteRouter.delete('/books/:id', async (ctx) => {
    try {
        const { id } = ctx.params;

        if (!ObjectId.isValid(id)) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid book ID format' };
            return;
        }

        const db = getDatabase();
        const result = await db.collection('books').deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            ctx.status = 404;
            ctx.body = { error: 'Book not found' };
            return;
        }

        ctx.status = 204;
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: `Failed to delete book: ${error}` };
    }
});

export default deleteRouter;
