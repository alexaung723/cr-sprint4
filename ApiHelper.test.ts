import * as ApiHelper from "./ApiHelper";
import { apiBaseUrl } from "./config";

beforeEach(() => {
  jest
    .spyOn(global, "fetch")
    .mockImplementation(
      jest.fn(() =>
        Promise.resolve({ json: () => Promise.resolve({}) })
      ) as jest.Mock
    );
});

jest.mock("aws-amplify", () => ({
  ...jest.requireActual("aws-amplify"),
  Auth: {
    federatedSignIn: () => null,
    currentSession: () => ({
      getIdToken: () => ({
        getJwtToken: () => "jwt-token",
        payload: {
          identities: [
            {
              userId: "mock-user-id",
            },
          ],
          email: "mock_email@abc.com",
          exp: "",
        },
      }),
    }),
  },
}));

describe("ApiHelper", () => {
  it("getRequest passes correct arguments to fetch call", async () => {
    const expectedInput = {
      headers: {
        Authorization: "Bearer jwt-token",
        "Event-Type": "hacktober",
      },
      method: "GET",
    };

    await ApiHelper.getRequest("/mock-url");

    expect(fetch).toHaveBeenCalledWith(`${apiBaseUrl}/mock-url`, expectedInput);
  });

  it("postRequest passes correct arguments to fetch call", async () => {
    const mockData = { mockKey: "mockVal" };
    const expected = {
      method: "POST",
      headers: {
        Authorization: "Bearer jwt-token",
        "Event-Type": "hacktober",
      },
      body: JSON.stringify(mockData),
    };

    await ApiHelper.postRequest("/mock-url", mockData);

    expect(fetch).toHaveBeenCalledWith(`${apiBaseUrl}/mock-url`, expected);
  });
});
