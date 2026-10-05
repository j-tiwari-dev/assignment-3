// src/books/list.ts
import Router from '@koa/router';
import { Filter } from '../../adapter/assignment-3';
import { getDatabase } from '../db';
import { Filter as MongoFilter, ObjectId } from 'mongodb';

const listRouter = new Router();

// Interface for the document structure in MongoDB
interface BookDocument {
  _id: ObjectId;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// Interface for the book structure returned by the API
interface BookWithId {
  id: string;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

// The main route handler for GET /books
listRouter.get('/books', async (ctx) => {
  const filters = ctx.query.filters as Filter[] | undefined;

  try {
    let bookList: BookWithId[];
    if (filters && Array.isArray(filters) && filters.length > 0) {
      bookList = await getBooksFromDatabaseWithFilters(filters);
    } else {
      bookList = await getBooksFromDatabase();
    }
    ctx.body = bookList;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: `Failed to fetch books due to: ${error}` };
  }
});

// Function to get all books when no filters are applied
async function getBooksFromDatabase(): Promise<BookWithId[]> {
  const db = getDatabase();
  const books = await db.collection<BookDocument>('books').find({}).toArray();
  return books.map(doc => ({
    id: doc._id.toString(),
    name: doc.name,
    author: doc.author,
    description: doc.description,
    price: doc.price,
    image: doc.image
  }));
}

// The core logic for filtering books from the database
async function getBooksFromDatabaseWithFilters(filters: Filter[]): Promise<BookWithId[]> {
  const db = getDatabase();

  const filterConditions: MongoFilter<BookDocument>[] = filters.map(filter => {
    const conditions: MongoFilter<BookDocument>[] = [];

    if (filter.from !== undefined) {
      conditions.push({ price: { $gte: filter.from } });
    }
    if (filter.to !== undefined) {
      conditions.push({ price: { $lte: filter.to } });
    }
    if (filter.name !== undefined && filter.name.trim() !== '') {
      conditions.push({ name: { $regex: filter.name, $options: 'i' } });
    }
    if (filter.author !== undefined && filter.author.trim() !== '') {
      conditions.push({ author: { $regex: filter.author, $options: 'i' } });
    }
    
    return { $and: conditions };
  });

  const query: MongoFilter<BookDocument> = { $or: filterConditions };
  const books = await db.collection<BookDocument>('books').find(query).toArray();

  return books.map(doc => ({
    id: doc._id.toString(),
    name: doc.name,
    author: doc.author,
    description: doc.description,
    price: doc.price,
    image: doc.image
  }));
}

export default listRouter;