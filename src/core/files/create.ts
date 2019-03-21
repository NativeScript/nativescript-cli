import upload from './upload';

export default async function create(file, metadata, options) {
  return upload(file, metadata, options);
}
