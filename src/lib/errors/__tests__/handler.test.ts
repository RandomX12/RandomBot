import DiscordServersError, {
  DiscordServersErrorCode,
  ServersErrors,
} from "../DiscordServers";
import QzGameError, { QzErrors, QzGameErrorCode } from "../QuizGame";
import handleError from "../handler";

describe("testing the handleError function", () => {
  it("test QzErrors with handleError function", () => {
    for (let code of Object.keys(QzErrors)) {
      const error = new QzGameError(code as QzGameErrorCode, "any thing");
      expect(handleError(error)).toBeDefined();
    }
    //@ts-ignore
    const error = new QzGameError(77, "any thing");
    expect(handleError(error)).toBeDefined();
    //@ts-ignore
    const error2 = new QzGameError("777", "any thing");
    expect(handleError(error2)).toBeDefined();
    //@ts-ignore
    const error3 = new QzGameError(undefined, "any thing");
    expect(handleError(error3)).toBeDefined();
  });
  it("test DiscordServersError with handleError function", () => {
    for (let code in ServersErrors) {
      const error = new DiscordServersError(
        code as DiscordServersErrorCode,
        "any thing"
      );
      expect(handleError(error)).toBe(ServersErrors[code].message);
    }
  });
  it("test it with undefined error", () => {
    //@ts-ignore
    expect(handleError(undefined)).toBeString(true);
  });
  it("test it with null error", () => {
    expect(typeof handleError(null) === "string").toBe(true);
  });
});

expect.extend({
  toBeString(r) {
    if (typeof r === "string") {
      return {
        message() {
          return "the recived value is string";
        },
        pass: true,
      };
    }
    return {
      message() {
        return "the recived value is not a string";
      },
      pass: false,
    };
  },
});
