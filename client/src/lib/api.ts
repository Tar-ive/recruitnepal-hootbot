import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

export function useUploadCV() {
  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await fetch("/api/candidates", {
        method: "POST",
        body: data
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: [`/api/interviews/${id}`],
    enabled: !!id
  });
}

export function useSendMessage(interviewId: string) {
  return useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/interviews/${interviewId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/interviews/${interviewId}`] });
    }
  });
}
