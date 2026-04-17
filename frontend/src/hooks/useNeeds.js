import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { needsApi } from "../services/api";

export function useNeeds(params) {
	return useQuery({
		queryKey: ["needs", params],
		queryFn: () => needsApi.list(params)
	});
}

export function useCreateNeed() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: needsApi.create,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] })
	});
}

export function useResolveNeed() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (needId) => needsApi.resolve(needId),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["needs"] })
	});
}

export function useAssignNeed() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ needId, volunteerId }) => needsApi.assign(needId, volunteerId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["needs"] });
			queryClient.invalidateQueries({ queryKey: ["volunteers"] });
			queryClient.invalidateQueries({ queryKey: ["matches"] });
		}
	});
}
