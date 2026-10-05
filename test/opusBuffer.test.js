import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { OpusBuffer } from '../src/lib/opusBuffer.ts';

const tick = () => new Promise(resolve => setImmediate(resolve));
const packet = n => Buffer.from([n]);

test('waits for initial audio and refills after starvation', async () => {
  const stream = new OpusBuffer(3, 5);
  stream.write(packet(1));
  stream.write(packet(2));
  assert.equal(stream.read(), null);
  stream.write(packet(3));
  await tick();
  assert.deepEqual(stream.read(), packet(1));
  assert.deepEqual(stream.read(), packet(2));
  assert.deepEqual(stream.read(), packet(3));
  assert.equal(stream.read(), null);
  stream.write(packet(4));
  stream.write(packet(5));
  assert.equal(stream.read(), null);
  stream.write(packet(6));
  await tick();
  assert.deepEqual(stream.read(), packet(4));
  stream.destroy();
});

test('flushes short tracks and preserves all packet boundaries', async () => {
  const stream = new OpusBuffer(3, 5);
  stream.write(packet(1));
  stream.end(packet(2));
  const packets = [];
  for await (const chunk of stream) packets.push(chunk);
  assert.deepEqual(packets, [packet(1), packet(2)]);
});

test('backpressure bounds the queue and resumes when consumed', async () => {
  const stream = new OpusBuffer(2, 3);
  for (let n = 1; n <= 3; n++) stream.write(packet(n));
  let accepted = false;
  stream.write(packet(4), () => { accepted = true; });
  await tick();
  assert.equal(accepted, false);
  const packets = [];
  stream.end();
  for await (const chunk of stream) packets.push(chunk[0]);
  assert.deepEqual(packets, [1, 2, 3, 4]);
  assert.equal(accepted, true);
});

test('destroy releases a blocked writer', async () => {
  const stream = new OpusBuffer(2, 2);
  stream.on('error', () => {});
  stream.write(packet(1));
  let writeError;
  stream.write(packet(2), error => { writeError = error; });
  const closed = once(stream, 'close');
  stream.destroy();
  await closed;
  assert.ok(writeError instanceof Error);
});
