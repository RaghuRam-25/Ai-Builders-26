/**
 * End-to-end exercise of every backend data path against a real MongoDB.
 * Requires a reachable MONGODB_URI (see .env.smoke).
 *
 *   npx tsx scripts/integration.ts
 */
process.env.NODE_ENV = "test";

import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import * as authService from "../src/services/auth.service.js";
import * as governmentService from "../src/services/government.service.js";
import * as profileService from "../src/services/profile.service.js";
import * as notificationService from "../src/services/notification.service.js";
import * as trainingService from "../src/services/training.service.js";
import * as jobsService from "../src/services/jobs.service.js";
import * as assistantService from "../src/services/assistant.service.js";
import * as chatService from "../src/services/chat.service.js";
import * as documentService from "../src/services/document.service.js";
import { getMatchedServiceIds } from "../src/types/profile-matching.js";

let failures = 0;
function check(name: string, condition: boolean, extra?: unknown) {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name}`, JSON.stringify(extra)?.slice(0, 400) ?? "");
  }
}

const unique = Date.now().toString().slice(-8);

await connectDatabase();

try {
  console.log("government catalog");
  const services = await governmentService.listServices({ lang: "bn" });
  check("six services loaded", services.length === 6, services.length);
  const ids = services.map((s) => s.id).sort();
  check(
    "service ids match the original",
    JSON.stringify(ids) ===
      JSON.stringify(["birth", "jobs", "nid", "passport", "social-support", "training"]),
    ids,
  );
  const nid = await governmentService.getServiceById("nid", "bn");
  check("nid has documents", nid.documents.length > 0, nid.documents.length);
  check("nid has steps", nid.steps.length > 0, nid.steps.length);
  check("nid has an officialSource", typeof nid.officialSource === "string");

  const nidEn = await governmentService.getServiceById("nid", "en");
  check("english translation applied", nidEn.title !== nid.title, {
    bn: nid.title,
    en: nidEn.title,
  });

  const social = await governmentService.getServiceById("social-support", "bn");
  check("social-support keeps nested programs", (social.programs?.length ?? 0) > 0, social.programs?.length);
  const passport = await governmentService.getServiceById("passport", "bn");
  check("passport keeps nested options", (passport.options?.length ?? 0) > 0, passport.options?.length);

  const found = await governmentService.searchServices("পাসপোর্ট", 5, "bn");
  check("bengali search finds passport", found.some((s) => s.id === "passport"), found.map((s) => s.id));

  const context = await governmentService.resolveContext("পাসপোর্টের জন্য কী কাগজ লাগবে", "bn");
  check("context resolution returns a service", context?.service?.id === "passport", context?.service?.id);

  const categories = await governmentService.listCategories("bn");
  check("five categories", categories.length === 5, categories.length);
  const suggestionsBn = await governmentService.listSuggestions("bn");
  const suggestionsEn = await governmentService.listSuggestions("en");
  check("three suggestions", suggestionsBn.length === 3, suggestionsBn.length);
  check(
    "suggestions are localized",
    suggestionsBn[0].label !== suggestionsEn[0].label &&
      suggestionsEn[0].label === suggestionsEn[0].labelEn,
    { bn: suggestionsBn[0].label, en: suggestionsEn[0].label },
  );

  console.log("training + jobs");
  const programs = await trainingService.listTrainingPrograms();
  check("three training programs", programs.length === 3, programs.length);
  const program = programs[0];
  check("program exposes age bounds", program.ageMin <= program.ageMax, {
    min: program.ageMin,
    max: program.ageMax,
  });
  const jobs = await jobsService.listJobOpportunities();
  check("three job notices", jobs.length === 3, jobs.length);

  console.log("registration + auth");
  const mobile = `01${unique}`;
  const registered = await authService.registerUser({
    name: "টেস্ট নাগরিক",
    mobile,
    password: "supersecret123",
    age: 64,
    district: "ঢাকা",
    gender: "পুরুষ",
    isBangladeshi: true,
  });
  check("register returns a user id", typeof registered.user.id === "string", registered.user);
  check("register returns an access token", registered.tokens.accessToken.length > 20);
  check("register returns a refresh token", registered.tokens.refreshToken.length > 20);
  check("register role defaults to user", registered.user.role === "user", registered.user.role);

  const profileAfterRegister = await profileService.getCitizenProfile(registered.user.id);
  check("registration persisted the profile", profileAfterRegister?.name === "টেস্ট নাগরিক", profileAfterRegister);
  check("age stored as string like the original", profileAfterRegister?.age === "64", profileAfterRegister?.age);

  const duplicate = await authService
    .registerUser({
      name: "ডুপ্লিকেট",
      mobile,
      password: "supersecret123",
      age: 30,
      district: "ঢাকা",
      gender: "পুরুষ",
      isBangladeshi: true,
    })
    .then(() => null)
    .catch((error: unknown) => error);
  check("duplicate mobile rejected with 409", (duplicate as { status?: number })?.status === 409, duplicate);

  const loggedIn = await authService.loginUser({ mobile, password: "supersecret123" });
  check("login succeeds", loggedIn.user.id === registered.user.id);
  check("login lastSignedInAt is set", typeof loggedIn.user.lastSignedInAt === "string");

  const badLogin = await authService
    .loginUser({ mobile, password: "wrongpassword" })
    .then(() => null)
    .catch((error: unknown) => error);
  check("wrong password rejected with 401", (badLogin as { status?: number })?.status === 401, badLogin);

  const refreshed = await authService.refreshSession(registered.tokens.refreshToken);
  check("refresh issues new tokens", refreshed.tokens.accessToken.length > 20);

  console.log("profile matching + notifications");
  const updated = await profileService.upsertCitizenProfile(registered.user.id, {
    name: "টেস্ট নাগরিক",
    age: 64,
    district: "ঢাকা",
    education: "বিএ",
    occupation: "কৃষি",
    income: "কম",
    gender: "পুরুষ",
    isBangladeshi: true,
    jobSeeking: false,
    nidVerified: false,
    wantsTravel: true,
  });
  check("profile upsert persists education", updated.education === "বিএ", updated.education);
  check("profile upsert persists jobSeeking", updated.jobSeeking === false, updated.jobSeeking);

  const expectedMatches = getMatchedServiceIds(updated);
  check("matches include social-support (age>=60)", expectedMatches.includes("social-support"), expectedMatches);
  check("matches include nid (not verified)", expectedMatches.includes("nid"), expectedMatches);
  check("matches include passport (wantsTravel)", expectedMatches.includes("passport"), expectedMatches);

  const { availableServiceIds } = await profileService.syncMatchedNotifications(registered.user.id, updated);
  check(
    "backend matches the shared algorithm",
    JSON.stringify(availableServiceIds) === JSON.stringify(expectedMatches),
    { backend: availableServiceIds, shared: expectedMatches },
  );

  const notifications = await notificationService.listServiceNotifications(registered.user.id);
  check("notifications created for matches", notifications.length === expectedMatches.length, {
    got: notifications.length,
    want: expectedMatches.length,
  });
  check("notification serviceIds match", notifications.every((n) => expectedMatches.includes(n.serviceId)), notifications.map((n) => n.serviceId));
  check("notifications start unread", notifications.every((n) => n.readAt === null));

  await notificationService.ensureServiceNotifications(registered.user.id, [
    { serviceId: "nid", title: "dup", body: "dup" },
  ]);
  const afterDedupe = await notificationService.listServiceNotifications(registered.user.id);
  check("duplicate notifications are not created", afterDedupe.length === notifications.length, {
    before: notifications.length,
    after: afterDedupe.length,
  });

  const marked = await notificationService.markServiceNotificationRead(
    registered.user.id,
    notifications[0].id,
  );
  check("mark-read works", marked?.readAt !== null, marked);

  console.log("assistant");
  const serviceList = await governmentService.listServices({ lang: "bn" });
  const answer = await assistantService.answerAssistantQuery({
    userId: registered.user.id,
    message: "পাসপোর্টের জন্য কী কাগজপত্র লাগবে?",
    lang: "bn",
    context: null,
    services: serviceList,
  });
  check("assistant resolves a service", answer.context.serviceId === "passport", answer.context);
  check("assistant returns a non-empty reply", answer.reply.length > 10, answer.reply);
  check("assistant returns a source", answer.sources.length === 1, answer.sources);
  check(
    "assistant source points at the official reference",
    typeof answer.sources[0]?.officialSource === "string" &&
      answer.sources[0].officialSource.length > 0,
    answer.sources[0],
  );
  check(
    "officialSource keeps the original bare-domain form",
    answer.sources[0]?.officialSource === "epassport.gov.bd",
    answer.sources[0]?.officialSource,
  );

  const unknown = await assistantService.answerAssistantQuery({
    userId: registered.user.id,
    message: "আজকের আবহাওয়া কেমন",
    lang: "bn",
    context: null,
    services: serviceList,
  });
  check("assistant refuses unrelated questions", unknown.context.serviceId === null, unknown.context);
  check("refusal explains itself", unknown.reply.length > 20, unknown.reply);

  console.log("chat history");
  const conversation = await chatService.createConversation(registered.user.id, "পাসপোর্ট প্রশ্ন");
  check("conversation created", conversation.id.length > 0);
  await chatService.appendChatMessage(registered.user.id, conversation.id, {
    role: "user",
    content: "পাসপোর্টের জন্য কী কাগজ লাগবে?",
  });
  await chatService.appendChatMessage(registered.user.id, conversation.id, {
    role: "assistant",
    content: answer.reply,
    sources: answer.sources,
  });
  const messages = await chatService.getConversationMessages(registered.user.id, conversation.id);
  check("both messages stored in order", messages.length === 2 && messages[0].role === "user" && messages[1].role === "assistant", messages.map((m) => m.role));
  const conversations = await chatService.listConversations(registered.user.id);
  check("conversation list counts messages", conversations[0]?.messageCount === 2, conversations[0]?.messageCount);

  console.log("document eligibility");
  const eligible = await documentService.scanDocumentForEligibility(registered.user.id, {
    file: {
      originalname: "nid-scan.jpg",
      filename: "smoke-nid.jpg",
      mimetype: "image/jpeg",
      size: 1234,
    } as Express.Multer.File,
    target: "training",
    targetId: program.id,
  });
  check("scan persisted", eligible.id.length > 0, eligible.id);
  check("scan returns reasons", eligible.reasons.length > 0, eligible.reasons);
  check(
    "scan is not eligible for an out-of-range 64 year old",
    eligible.eligible === false,
    { eligible: eligible.eligible, program },
  );
  check("scan fileName preserved", eligible.fileName === "nid-scan.jpg", eligible.fileName);

  const scans = await documentService.listDocumentScans(registered.user.id);
  check("scan listed", scans.length === 1, scans.length);
  const removed = await documentService.deleteDocumentScan(registered.user.id, eligible.id);
  check("scan deleted", removed.id === eligible.id);
  const scansAfter = await documentService.listDocumentScans(registered.user.id);
  check("scan list is empty after delete", scansAfter.length === 0, scansAfter.length);

  console.log("cross-user isolation");
  const otherMobile = `01${unique}X`.slice(0, 11);
  const other = await authService.registerUser({
    name: "অন্য নাগরিক",
    mobile: otherMobile,
    password: "supersecret123",
    age: 25,
    district: "চট্টগ্রাম",
    gender: "নারী",
    isBangladeshi: true,
  });
  const otherNotifications = await notificationService.listServiceNotifications(other.user.id);
  check("other user sees no notifications", otherNotifications.length === 0, otherNotifications.length);
  const otherScans = await documentService.listDocumentScans(other.user.id);
  check("other user sees no scans", otherScans.length === 0, otherScans.length);
  const otherConversations = await chatService.listConversations(other.user.id);
  check("other user sees no conversations", otherConversations.length === 0, otherConversations.length);

  const stolen = await chatService
    .getConversationMessages(other.user.id, conversation.id)
    .then(() => null)
    .catch((error: unknown) => error);
  check("cross-user conversation read is rejected", (stolen as { status?: number })?.status === 404, stolen);
} finally {
  await disconnectDatabase();
}

console.log(failures === 0 ? "\nALL INTEGRATION CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
