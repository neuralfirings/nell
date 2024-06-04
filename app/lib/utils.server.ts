import Sqids from 'sqids';
import fs from 'fs';

const sqids = new Sqids({
  alphabet: process.env.NELL_SQIDS_ALPHABET,
  minLength: 6
})

export function sqidify(id: number) {
  return sqids.encode([id])
}

export function desqidify(sqid: string) {
  return sqids.decode(sqid)[0]
}

export function prependToFile(filePath: string, content: any) {
  try {
    // Read the existing file content
    const existingContent = fs.readFileSync(filePath, 'utf8');

    // Prepend the new content to the existing content
    const updatedContent = content + existingContent;

    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf8');

    console.log('Content prepended to the file successfully.');
  } catch (error) {
    console.error('Error prepending content to the file:', error);
  }
}