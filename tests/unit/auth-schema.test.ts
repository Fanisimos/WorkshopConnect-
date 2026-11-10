import { describe, expect, it } from "vitest";

import { signInSchema, signUpSchema } from "@/features/auth/schema";

describe("signUpSchema", () => {
  const valid = { fullName: "Sam Patel", email: "Sam.Patel@Example.ac.uk ", password: "correct-horse" };

  it("accepts valid input and normalises the email", () => {
    const result = signUpSchema.parse(valid);
    expect(result.email).toBe("sam.patel@example.ac.uk");
    expect(result.fullName).toBe("Sam Patel");
  });

  it("ignores any role field a client tries to send", () => {
    const result = signUpSchema.parse({ ...valid, role: "organiser" });
    expect(result).not.toHaveProperty("role");
  });

  it.each([
    ["blank name", { ...valid, fullName: "   " }, "fullName"],
    ["invalid email", { ...valid, email: "not-an-email" }, "email"],
    ["short password", { ...valid, password: "1234567" }, "password"],
    ["overlong name", { ...valid, fullName: "x".repeat(101) }, "fullName"],
  ])("rejects %s", (_label, input, field) => {
    const result = signUpSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
});

describe("signInSchema", () => {
  it("requires a password", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
