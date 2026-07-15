import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnvFile(path) {
  return Object.fromEntries(
    fs.readFileSync(path, "utf8").trim().split(/\n/).map((line) => line.split(/=(.*)/s).slice(0, 2)),
  );
}

const localEnv = readEnvFile(".env.local");
const url = localEnv.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email1 = process.env.TEST_USER_1;
const email2 = process.env.TEST_USER_2;
const password = process.env.TEST_PASSWORD;

if (!url || !anonKey || !email1 || !email2 || !password) {
  throw new Error("Missing Supabase config or temporary test credentials.");
}

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const user1 = createClient(url, anonKey, options);
const user2 = createClient(url, anonKey, options);
const created = { question1: null, rule1: null, rule2: null, mock1: null };

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function cleanup() {
  const deletions = [];
  if (created.question1) deletions.push(user1.from("questions").delete().eq("id", created.question1));
  if (created.mock1) deletions.push(user1.from("mock_tests").delete().eq("id", created.mock1));
  if (created.rule1) deletions.push(user1.from("rules").delete().eq("id", created.rule1));
  if (created.rule2) deletions.push(user2.from("rules").delete().eq("id", created.rule2));
  const deletionResults = await Promise.all(deletions);
  if (deletionResults.some((result) => result.error)) throw new Error("Test data cleanup failed.");

  const checks = [];
  if (created.question1) checks.push(user1.from("questions").select("id").eq("id", created.question1));
  if (created.mock1) checks.push(user1.from("mock_tests").select("id").eq("id", created.mock1));
  if (created.rule1) checks.push(user1.from("rules").select("id").eq("id", created.rule1));
  if (created.rule2) checks.push(user2.from("rules").select("id").eq("id", created.rule2));
  const checkResults = await Promise.all(checks);
  assert(checkResults.every((result) => !result.error && result.data.length === 0), "all temporary test data is removed");
  await Promise.all([user1.auth.signOut(), user2.auth.signOut()]);
}

try {
  const [login1, login2] = await Promise.all([
    user1.auth.signInWithPassword({ email: email1, password }),
    user2.auth.signInWithPassword({ email: email2, password }),
  ]);
  assert(!login1.error && Boolean(login1.data.user), "temporary user 1 can authenticate");
  assert(!login2.error && Boolean(login2.data.user), "temporary user 2 can authenticate");

  const mockResult = await user1.from("mock_tests").insert({
    name: "Codex RLS probe",
    taken_on: "2026-07-15",
    listening_score: 455,
    reading_score: 445,
    notes: "temporary",
  }).select().single();
  if (mockResult.error) throw mockResult.error;
  created.mock1 = mockResult.data.id;
  assert(mockResult.data.total_score === 900, "mock test insert and generated total work");

  const [rule1Result, rule2Result] = await Promise.all([
    user1.from("rules").insert({ title: "User 1 probe", rule_text: "Temporary rule one", keywords: ["probe"] }).select().single(),
    user2.from("rules").insert({ title: "User 2 probe", rule_text: "Temporary rule two", keywords: ["probe"] }).select().single(),
  ]);
  if (rule1Result.error) throw rule1Result.error;
  if (rule2Result.error) throw rule2Result.error;
  created.rule1 = rule1Result.data.id;
  created.rule2 = rule2Result.data.id;
  assert(Boolean(created.rule1 && created.rule2), "each user can create an owned rule");

  const questionResult = await user1.from("questions").insert({
    mock_test_id: created.mock1,
    toeic_part: "part_7",
    capture_reason: "wrong",
    error_types: ["paraphrase", "distractor"],
    question_text: "Temporary RLS probe question",
    occurred_on: "2026-07-15",
  }).select().single();
  if (questionResult.error) throw questionResult.error;
  created.question1 = questionResult.data.id;
  assert(questionResult.data.error_types.length === 2, "question supports multiple error types");

  const ownLink = await user1.from("question_rules").insert({ question_id: created.question1, rule_id: created.rule1 });
  assert(!ownLink.error, "owner can link an owned question to an owned rule");

  const [foreignRuleRead, foreignQuestionRead, foreignMockRead] = await Promise.all([
    user1.from("rules").select("id").eq("id", created.rule2),
    user2.from("questions").select("id").eq("id", created.question1),
    user2.from("mock_tests").select("id").eq("id", created.mock1),
  ]);
  assert(!foreignRuleRead.error && foreignRuleRead.data.length === 0, "user 1 cannot read user 2 rule");
  assert(!foreignQuestionRead.error && foreignQuestionRead.data.length === 0, "user 2 cannot read user 1 question");
  assert(!foreignMockRead.error && foreignMockRead.data.length === 0, "user 2 cannot read user 1 mock test");

  const foreignLink = await user1.from("question_rules").insert({ question_id: created.question1, rule_id: created.rule2 });
  assert(Boolean(foreignLink.error), "junction RLS rejects a cross-user question-rule link");

  const reviewResult = await user1.rpc("record_rule_review", {
    p_rule_id: created.rule1,
    p_outcome: "remembered",
    p_step_before: 0,
    p_step_after: 1,
    p_next_review_on: "2026-07-18",
  });
  if (reviewResult.error) throw reviewResult.error;
  const [updatedRule, reviewRows] = await Promise.all([
    user1.from("rules").select("review_step,next_review_on").eq("id", created.rule1).single(),
    user1.from("reviews").select("outcome,step_before,step_after,next_review_on").eq("rule_id", created.rule1),
  ]);
  assert(!updatedRule.error && updatedRule.data.review_step === 1 && updatedRule.data.next_review_on === "2026-07-18", "review RPC updates scheduler state atomically");
  assert(!reviewRows.error && reviewRows.data.length === 1 && reviewRows.data[0].outcome === "remembered", "review RPC writes immutable history");

  const foreignReview = await user2.rpc("record_rule_review", {
    p_rule_id: created.rule1,
    p_outcome: "forgotten",
    p_step_before: 1,
    p_step_after: 0,
    p_next_review_on: "2026-07-16",
  });
  assert(Boolean(foreignReview.error), "user 2 cannot review user 1 rule");
} finally {
  await cleanup();
}
