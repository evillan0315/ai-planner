import React from 'react';
import { Box, useTheme } from '@mui/material';
import { ContentLayout } from '@/components/ui/layouts/ContentLayout';
import { PlanInputForm } from './PlanInputForm';
import { PlanGenerationStatus } from './PlanGenerationStatus';


import PlanHeader from './PlanHeader';
import PlanDrawers from './PlanDrawers';
import usePlanGeneratorLogic from './usePlanGeneratorLogic';

const PlanGenerator: React.FC = () => {
  const theme = useTheme();

  const {
    // store-derived state
    userPrompt,
    revisionTone,
    projectRoot,
    scanPathsInput,
    additionalInstructions,
    expectedOutputFormat,
    fileData,
    fileMimeType,
    selectedFile,
    isLoading,
    error,
    plan,
    applyStatus,
    snackbarOpen,
    snackbarSeverity,
    snackbarMessage,
    // refs
    fileInputRef,
    // handlers
    handleFileChange,
    handleClearFile,
    handleGeneratePlan,
    handlePromptGenerate,
    handleClearPlan,
    openProjectRootPicker,
    openScanPathsDrawer,
    openPlannerListDrawer,
    openAiInstructionDrawer,
    openSystemConfig,
    openExpectedOutputDrawer,
    openErrorDetailsDrawer,
    handleRevisionTone,
    handleEditFileChangeRequest,
    handleSavePlanMetadata,
    handleSaveEditedFileChange,
    handleSnackbarClose,
    headerLeftActions,
    headerRightActions,
    planTitleHeader,
    // drawer props grouped for simple rendering
    drawersProps,
  } = usePlanGeneratorLogic();

  return (
    <Box className="flex flex-col h-full w-full overflow-hidden">
      <Box className="flex-grow min-h-0 h-full">
        <ContentLayout
          headerContent={planTitleHeader}
          headerRightActions={headerRightActions}
          headerLeftActions={headerLeftActions}
          headerHeight={48}
          footerHeight={0}
          contentWrapperSx={{
            p: 0,
          }}
        >
          <PlanGenerationStatus
            isLoading={isLoading}
            plan={plan}
            onEditPlanMetadata={drawersProps.setIsPlanMetadataEditorOpen}
            onEditFileChange={handleEditFileChangeRequest}
          />
        </ContentLayout>
      </Box>

      <Box
        className="flex-shrink-0 mt-2"
        sx={{
          //backgroundColor: theme.palette.background.paper,
          borderTop: `2px solid ${theme.palette.divider}`,
        }}
      >
        <PlanInputForm
          userPrompt={userPrompt}
          revisionTone={revisionTone}
          setUserPrompt={drawersProps.setUserPrompt}
          projectRoot={projectRoot}
          scanPathsInput={scanPathsInput}
          additionalInstructions={additionalInstructions}
          expectedOutputFormat={expectedOutputFormat}
          fileData={fileData}
          fileMimeType={fileMimeType}
          selectedFile={selectedFile}
          isLoading={isLoading}
          error={error}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleClearFile={handleClearFile}
          handleGeneratePlan={handleGeneratePlan}
          handlePromptGenerate={handlePromptGenerate}
          handleClearPlan={handleClearPlan}
          openProjectRootPicker={openProjectRootPicker}
          openScanPathsDrawer={openScanPathsDrawer}
          openPlannerListDrawer={openPlannerListDrawer}
          openAiInstructionDrawer={openAiInstructionDrawer}
          openSystemConfig={openSystemConfig}
          openExpectedOutputDrawer={openExpectedOutputDrawer}
          openErrorDetailsDrawer={openErrorDetailsDrawer}
          plan={plan}
          handleRevisionTone={handleRevisionTone}
        />
      </Box>

      <PlanDrawers {...drawersProps} />

    </Box>
  );
};

export default PlanGenerator;

