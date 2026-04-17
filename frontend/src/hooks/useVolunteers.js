import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { volunteersApi } from "../services/api";

export function useVolunteers(params) {
	return useQuery({
		queryKey: ["volunteers", params],
		queryFn: () => volunteersApi.list(params)
	});
}

export function useUpdateAvailability() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ volunteerId, status }) => volunteersApi.updateAvailability(volunteerId, status),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["volunteers"] })
	});
}
