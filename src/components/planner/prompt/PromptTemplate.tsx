import React from "react";
import PromptTemplateForm from "./PromptTemplateForm";
import type { ILlmInput } from "../types";
import { Box, Card, CardContent, Typography } from "@mui/material";

type Props = {
  onSend: (payload: ILlmInput) => Promise<void> | void;
  initial?: Partial<ILlmInput>;
};

/**
 * PromptTemplate wraps the form and provides a simple header/description.
 * Use onSend to hook into your API client that POSTs to /api/plan.
 */
export default function PromptTemplate({ onSend, initial }: Props) {
  const handleSubmit = async (payload: ILlmInput) => {
    // Additional local validation or transformation could go here.
    await onSend(payload);
  };

  return (
    <Card className="bg-transparent shadow-none">
      <CardContent>
        <Box className="p-4 rounded-lg">
          <Typography variant="h5" gutterBottom>
            Create AI Plan Request
          </Typography>
          <Typography variant="body2" color="textSecondary" className="mb-4">
            Fill out the instruction and scan paths. The UI will produce an ILlmInput payload ready to POST to <code>/api/plan</code>.
          </Typography>

          <PromptTemplateForm initial={initial} onSubmit={handleSubmit} />
        </Box>
      </CardContent>
    </Card>
  );
}