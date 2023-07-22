import { connectDB } from "../connectDB";
test(`test connectDB function`, async () => {
  const connect = jest.fn(async () => {
    await connectDB();
  });
  await connect();
});
