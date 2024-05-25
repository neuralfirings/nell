import Sqids from 'sqids';

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