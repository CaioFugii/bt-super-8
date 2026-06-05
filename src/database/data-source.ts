import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { createTypeOrmOptions } from './database.config';

export default new DataSource(createTypeOrmOptions(process.env));
