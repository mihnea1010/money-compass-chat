import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { buildSavingsOffers, EXAMPLE_SETTINGS, EXAMPLE_TRANSACTIONS, type BankOffer } from "@/lib/savings-offers";
import { EMPTY_SETTINGS, loadOptimizationState, type OptimizationState } from "@/lib/optimization-state";
import { loadStatement, type Tranzactie } from "@/lib/statement";
import { loadOprite } from "@/lib/subscriptions";

export function useBankOffers() {
  return useQuery({
    queryKey: ["bank_offers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_offers").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as BankOffer[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useSavings() {
  const [transactions, setTransactions] = useState<Tranzactie[]>([]);
  const [stopped, setStopped] = useState<string[]>([]);
  const [state, setState] = useState<OptimizationState>({ settings: EMPTY_SETTINGS, records: [] });
  const [today, setToday] = useState(new Date());
  useEffect(() => {
    setTransactions(loadStatement() ?? []); setState(loadOptimizationState()); setStopped(loadOprite());
    const timer = setInterval(() => setToday(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const bank = useBankOffers();
  const example = transactions.length === 0;
  // With a loaded statement, demo offers still compute a clearly-labelled
  // simulated amount (demoCashback) so the Economisește total is never a bare 0.
  const offers = useMemo(() => buildSavingsOffers(example ? EXAMPLE_TRANSACTIONS : transactions, example ? EXAMPLE_SETTINGS : state.settings, today, example ? [] : state.records, bank.data ?? [], { demoScenario: example, demoCashback: !example }), [example, transactions, state, today, bank.data]);
  return { transactions, stopped, state, setState, today, example, offers, bankLoading: bank.isLoading, bankError: bank.isError };
}
