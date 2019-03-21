import upload from './upload';

export default async function update(file, metadata, options) {
  return upload(file, metadata, options);
}
