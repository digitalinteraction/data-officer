import { assertMatch } from "../../deps_test.ts";
import {
  _monitorDownMessage,
  _monitorUpMessage,
  UpDownAlert,
} from "../../src/uptimerobot.ts";

const alert: Omit<UpDownAlert, "alertType"> = {
  monitorID: "123456",
  monitorURL: "https://example.com",
  monitorFriendlyName: "ExampleMonitor",
  alertTypeFriendlyName: "AlertType",
  alertDetails: "alert details",
  alertDuration: "123.456",
  monitorAlertContacts: "",
};

Deno.test("_monitorDownMessage", async (t) => {
  await t.step("should format the message", () => {
    const result = _monitorDownMessage({ ...alert, alertType: "1" });
    assertMatch(result, /ExampleMonitor is down/i);
  });
});

Deno.test("_monitorUpMessage", async (t) => {
  await t.step("should format the message", () => {
    const result = _monitorUpMessage({ ...alert, alertType: "0" });
    assertMatch(result, /ExampleMonitor is back up/i);
    assertMatch(result, /2m 3s/i);
  });
});
