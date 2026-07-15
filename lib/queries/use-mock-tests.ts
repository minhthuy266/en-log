"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/query-keys";
import { getCurrentUserId } from "@/lib/queries/user";
import { createClient } from "@/lib/supabase/client";
import { mockTestSchema, type MockTestFormValues } from "@/lib/validations/mock-test";
import type { MockTest } from "@/types/app";

export function useMockTests() {
  return useQuery<MockTest[], Error>({ queryKey: queryKeys.mockTests, queryFn: async () => {
    const { data, error } = await createClient().from("mock_tests").select("*").order("taken_on", { ascending: false });
    if (error) throw error;
    return data as MockTest[];
  }});
}

export function useCreateMockTest() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (values: MockTestFormValues) => {
    const userId = await getCurrentUserId();
    const parsed = mockTestSchema.parse(values);
    const { data, error } = await createClient().from("mock_tests").insert({ ...parsed, user_id: userId }).select().single();
    if (error) throw error;
    return data as MockTest;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.mockTests }), client.invalidateQueries({ queryKey: queryKeys.analytics })]); }});
}

export function useDeleteMockTest() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (id: string) => {
    const { error } = await createClient().from("mock_tests").delete().eq("id", id);
    if (error) throw error;
  }, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: queryKeys.mockTests }), client.invalidateQueries({ queryKey: queryKeys.questions }), client.invalidateQueries({ queryKey: queryKeys.analytics })]); }});
}
