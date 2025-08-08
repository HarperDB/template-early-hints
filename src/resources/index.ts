import { databases, logger } from 'harperdb';
import { GetHints } from './hints.js';
import { ProductImages } from "../types/graphql.js";

const {
  ProductImages: ProductImagesTable,
} = databases.EarlyHints;

import seedData from "./seedData.json" with { type: "json" };

// @ts-ignore
if (server.workerIndex === 0) {
  logger.info('Seeding ProductImages Database');
  seedData.forEach((item: ProductImages) => {
    ProductImagesTable.put(item);
  });
}

export const hints = GetHints;
