import previous_assignment from './assignment-2';

export type BookID = string;

export interface Book {
  id?: BookID;
  name: string;
  author: string;
  description: string;
  price: number;
  image: string;
}

export interface Filter {
  from?: number;
  to?: number;
  name?: string;
  author?: string;
}

// If multiple filters are provided, any book that matches at least one of them should be returned
// Within a single filter, a book would need to match all the given conditions
async function listBooks(filters?: Filter[]): Promise<Book[]> {
  // Build query string in qs format
  const query = filters?.map((filter, index) => {
    const parts: string[] = [];
    if (filter.from !== undefined) {
      parts.push(`filters[${index}][from]=${filter.from}`);
    }
    if (filter.to !== undefined) {
      parts.push(`filters[${index}][to]=${filter.to}`);
    }
    if (filter.name !== undefined) {
      parts.push(`filters[${index}][name]=${encodeURIComponent(filter.name)}`);
    }
    if (filter.author !== undefined) {
      parts.push(`filters[${index}][author]=${encodeURIComponent(filter.author)}`);
    }
    return parts.join('&');
  }).filter(s => s.length > 0).join('&') ?? '';

  const result = await fetch(`http://localhost:3000/books?${query}`);

  if (result.ok) {
    return (await result.json() as Book[]);
  } else {
    console.log('Failed to fetch books: ', await result.text());
    throw new Error('Failed to fetch books');
  }
}

async function createOrUpdateBook(book: Book): Promise<BookID> {
  return await previous_assignment.createOrUpdateBook(book);
}

async function removeBook(book: BookID): Promise<void> {
  await previous_assignment.removeBook(book);
}

const assignment = 'assignment-3';

export default {
  assignment,
  createOrUpdateBook,
  removeBook,
  listBooks
};
