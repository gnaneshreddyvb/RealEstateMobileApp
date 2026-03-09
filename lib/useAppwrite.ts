import { Alert } from "react-native";
import { useEffect, useState, useCallback } from "react";

interface UseAppwriteOptions<T, P extends Record<string, string | number>> {
    fn: (params: P) => Promise<T>;
    params?: P;
    skip?: boolean;
}

interface UseAppwriteReturn<T, P> {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: (newParams?: P) => Promise<void>;  // Made optional
}

export const useAppwrite = <T, P extends Record<string, string | number>>({
                                                                              fn,
                                                                              params = {} as P,
                                                                              skip = false,
                                                                          }: UseAppwriteOptions<T, P>): UseAppwriteReturn<T, P> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(
        async (fetchParams?: P) => {  // Made optional
            setLoading(true);
            setError(null);

            try {
                const result = await fn(fetchParams ?? params);  // Use fallback
                setData(result);
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : "An unknown error occurred";
                setError(errorMessage);
                Alert.alert("Error", errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [fn, params]  // Added params to dependency array
    );

    useEffect(() => {
        if (!skip) {
            fetchData(params);
        }
    }, []);

    const refetch = async (newParams?: P) => await fetchData(newParams ?? params);  // Made optional with fallback

    return { data, loading, error, refetch };
};