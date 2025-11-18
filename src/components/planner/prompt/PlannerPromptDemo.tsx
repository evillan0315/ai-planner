import React, { useState } from "react";
import PromptTemplate from "./PromptTemplate";
import type { ILlmInput } from "../types";
import { Container, Snackbar, Alert, CircularProgress, Box } from "@mui/material";
import { plannerService } from "@/components/planner/api/plannerService";
import type { IGeneratePlanResponse } from "@/components/planner/types";

/**
 * Demo page showing how to use the PromptTemplate component.
 * This version demonstrates wiring the form to plannerService.generatePlan(...).
 * NOTE: This component is a demo and is not integrated into the main application flow currently.
 */
export default function PlannerPromptDemo() {
  const [loading, setLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [generatedPlanOutput, setGeneratedPlanOutput] = useState<IGeneratePlanResponse | null>(null);

  const sendPlan = async (payload: ILlmInput) => {
    setLoading(true);
    setNotice(null);
    setGeneratedPlanOutput(null);
    try {
      let result: IGeneratePlanResponse = await plannerService.generatePlan(payload);
      setGeneratedPlanOutput(result);
      setNotice("Plan generated successfully.");
      // eslint-disable-next-line no-console

    } catch (err) {
      setNotice(err?.message ?? "Failed to generate plan.");
      // eslint-disable-next-line no-console

    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-6">
      <PromptTemplate
        onSend={sendPlan}
        initial={{ expectedOutputFormat: "JSON", scanPaths: ["src", "tests"], requestType: "LLM_GENERATION" }}
      />

      <Box className="mt-4">
        {loading && (
          <Box className="flex items-center gap-2">
            <CircularProgress size={20} />
            <span>Processing…</span>
          </Box>
        )}

        {generatedPlanOutput && ( /* Display generated output if available */
          <Box className="mt-4">
            <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
              {JSON.stringify(generatedPlanOutput, null, 2)}
            </pre>
          </Box>
        )}
      </Box>

      <Snackbar open={!!notice} autoHideDuration={8000} onClose={() => setNotice(null)}>
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Container>
  );
}
