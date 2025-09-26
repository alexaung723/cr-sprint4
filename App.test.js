describe("App", () => {
  // Hub.listen is called with "auth"
  // Auth.federatedSignIn is called with {}
  // localStorage.setItem is called with "user-data" & userData
  test("sample test", () => {
    expect(true).toBe(true);
  });

  test("sample test 2", () => {
    expect(false).toBe(false);
  });
});
