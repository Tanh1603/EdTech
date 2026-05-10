import { fromProtoStruct, toProtoStruct } from './json.mapper';

describe('json.mapper', () => {
  it('round trips JSON values through protobuf Struct shape', () => {
    const value = {
      title: 'Exam',
      score: 9.5,
      published: true,
      answers: [{ questionId: 'q1', answer: 'A' }],
      optional: null,
    };

    expect(fromProtoStruct(toProtoStruct(value))).toEqual(value);
  });
});
