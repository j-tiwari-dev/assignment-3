import Router from '@koa/router';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../db';

const createRouter = new Router();

interface BookInput {
    id?: string;
    name: string;
    author: string;
    description: string;
    price: number;
    image: string;
}

function validateBookInput(body: unknown): { valid: boolean; error?: string; book?: BookInput } {
    if (!body || typeof body !== 'object') {
        return { valid: false, error: 'Request body must be a JSON object' };
    }

    const { id, name, author, description, price, image } = body as Record<string, unknown>;

    if (typeof name !== 'string' || name.trim() === '') {
        return { valid: false, error: 'Name is required and must be a non-empty string' };
    }

    if (typeof author !== 'string' || author.trim() === '') {
        return { valid: false, error: 'Author is required and must be a non-empty string' };
    }

    if (typeof description !== 'string') {
        return { valid: false, error: 'Description is required and must be a string' };
    }

    if (typeof price !== 'number' || isNaN(price) || price < 0) {
        return { valid: false, error: 'Price is required and must be a non-negative number' };
    }

    if (typeof image !== 'string') {
        return { valid: false, error: 'Image is required and must be a string' };
    }

    return {
        valid: true,
        book: {
            id: typeof id === 'string' ? id : undefined,
            name: name.trim(),
            author: author.trim(),
            description,
            price,
            image
        }
    };
}

// Create a new book
createRouter.post('/books', async (ctx) => {
    try {
        const validation = validateBookInput(ctx.request.body);

        if (!validation.valid) {
            ctx.status = 400;
            ctx.body = { error: validation.error };
            return;
        }

        const book = validation.book!;
        const db = getDatabase();

        // If id is provided, this is an update (upsert)
        if (book.id) {
            if (!ObjectId.isValid(book.id)) {
                ctx.status = 400;
                ctx.body = { error: 'Invalid book ID format' };
                return;
            }

            await db.collection('books').updateOne(
                { _id: new ObjectId(book.id) },
                {
                    $set: {
                        name: book.name,
                        author: book.author,
                        description: book.description,
                        price: book.price,
                        image: book.image
                    }
                },
                { upsert: true }
            );

            ctx.status = 200;
            ctx.body = { id: book.id };
        } else {
            // Create new book
            const result = await db.collection('books').insertOne({
                name: book.name,
                author: book.author,
                description: book.description,
                price: book.price,
                image: book.image
            });

            ctx.status = 201;
            ctx.body = { id: result.insertedId.toString() };
        }
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: `Failed to create/update book: ${error}` };
    }
});

// Update an existing book
createRouter.put('/books/:id', async (ctx) => {
    try {
        const { id } = ctx.params;

        if (!ObjectId.isValid(id)) {
            ctx.status = 400;
            ctx.body = { error: 'Invalid book ID format' };
            return;
        }

        const body = ctx.request.body as Record<string, unknown>;
        const validation = validateBookInput({ ...body, id });

        if (!validation.valid) {
            ctx.status = 400;
            ctx.body = { error: validation.error };
            return;
        }

        const book = validation.book!;
        const db = getDatabase();

        const result = await db.collection('books').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name: book.name,
                    author: book.author,
                    description: book.description,
                    price: book.price,
                    image: book.image
                }
            }
        );

        if (result.matchedCount === 0) {
            ctx.status = 404;
            ctx.body = { error: 'Book not found' };
            return;
        }

        ctx.status = 200;
        ctx.body = { id };
    } catch (error) {
        ctx.status = 500;
        ctx.body = { error: `Failed to update book: ${error}` };
    }
});

export default createRouter;
