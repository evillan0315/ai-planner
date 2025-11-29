import React from 'react';
import CustomDrawer from '@/components/Drawer/CustomDrawer';
import FileExplorerPlannerDrawerContent from '@/components/planner/drawerContent/FileExplorerPlannerDrawerContent';
import InstructionEditorDrawer from '@/components/planner/drawerContent/InstructionEditorDrawer';
import PlanMetadataEditorDrawer from '@/components/planner/drawerContent/PlanMetadataEditorDrawer';
import FileChangeEditorDrawer from '@/components/planner/drawerContent/FileChangeEditorDrawer';
import PlannerList from '@/components/planner/PlannerList';
import ErrorDetailsDrawerContent from '@/components/planner/drawerContent/ErrorDetailsDrawerContent';
import SystemConfigWrapper from '@/components/planner/drawerContent/SystemConfigWrapper';
import type { GlobalAction } from '@/components/ui/GlobalActionButton';

interface Props {
  isProjectRootPickerDialogOpen: boolean;
  setIsProjectRootPickerOpen?: (v: boolean) => void;
  setIsProjectRootPickerDialogOpen: (v: boolean) => void;
  isScanPathsDialogOpen: boolean;
  setIsScanPathsDialogOpen: (v: boolean) => void;
  isAiInstructionDrawerOpen: boolean;
  setIsAiInstructionDrawerOpen: (v: boolean) => void;
  isExpectedOutputDrawerOpen: boolean;
  setIsExpectedOutputDrawerOpen: (v: boolean) => void;
  isPlanMetadataEditorOpen: boolean;
  setIsPlanMetadataEditorOpen: (v: boolean) => void;
  isFileChangeEditorOpen: boolean;
  setIsFileChangeEditorOpen: (v: boolean) => void;
  editingFileChange: any;
  isPlannerListDrawerOpen: boolean;
  setIsPlannerListDrawerOpen: (v: boolean) => void;
  isSystemConfigDrawerOpen: boolean;
  setIsSystemConfigDrawerOpen: (v: boolean) => void;
  isErrorDetailsDrawerOpen: boolean;
  setIsErrorDetailsDrawerOpen: (v: boolean) => void;
  tempDrawerProjectRootInput: string;
  setTempDrawerProjectRootInput: (v: string) => void;
  localScanPaths: string[];
  setLocalScanPaths: (v: string[]) => void;
  directoryPickerDrawerActions: GlobalAction[];
  scanPathsDrawerActions: GlobalAction[];
  plannerListDrawerActions: GlobalAction[];
  errorDrawerActions: GlobalAction[];
  openProjectRootPicker: () => void;
  openScanPathsDrawer: () => void;
  openPlannerListDrawer: () => void;
  openAiInstructionDrawer: () => void;
  openSystemConfig: () => void;
  openExpectedOutputDrawer: () => void;
  openErrorDetailsDrawer: () => void;
  setUserPrompt?: (v: string) => void;
}

const PlanDrawers: React.FC<Props> = (props) => {
  const {
    isProjectRootPickerDialogOpen,
    setIsProjectRootPickerDialogOpen,
    isScanPathsDialogOpen,
    setIsScanPathsDialogOpen,
    isAiInstructionDrawerOpen,
    setIsAiInstructionDrawerOpen,
    isExpectedOutputDrawerOpen,
    setIsExpectedOutputDrawerOpen,
    isPlanMetadataEditorOpen,
    setIsPlanMetadataEditorOpen,
    isFileChangeEditorOpen,
    setIsFileChangeEditorOpen,
    editingFileChange,
    isPlannerListDrawerOpen,
    setIsPlannerListDrawerOpen,
    isSystemConfigDrawerOpen,
    setIsSystemConfigDrawerOpen,
    isErrorDetailsDrawerOpen,
    setIsErrorDetailsDrawerOpen,
    tempDrawerProjectRootInput,
    setTempDrawerProjectRootInput,
    localScanPaths,
    setLocalScanPaths,
    directoryPickerDrawerActions,
    scanPathsDrawerActions,
    plannerListDrawerActions,
    errorDrawerActions,
    openProjectRootPicker,
    openScanPathsDrawer,
    openPlannerListDrawer,
    openAiInstructionDrawer,
    openSystemConfig,
    openExpectedOutputDrawer,
    openErrorDetailsDrawer,
  } = props;

  return (
    <>
      <CustomDrawer
        open={isProjectRootPickerDialogOpen}
        onClose={() => setIsProjectRootPickerDialogOpen(false)}
        position="left"
        size="medium"
        title="Select Project Root Folder"
        hasBackdrop={true}
        footerActionButton={directoryPickerDrawerActions}
      >
        <FileExplorerPlannerDrawerContent
          mode="root"
          currentPath={tempDrawerProjectRootInput || '/'}
          currentScanPaths={[]}
          onPathChange={setTempDrawerProjectRootInput}
          onScanPathsChange={() => {}}
        />
      </CustomDrawer>

      <CustomDrawer
        open={isScanPathsDialogOpen}
        onClose={() => setIsScanPathsDialogOpen(false)}
        position="left"
        size="medium"
        title="Manage AI Scan Paths"
        hasBackdrop={true}
        footerActionButton={scanPathsDrawerActions}
      >
        <FileExplorerPlannerDrawerContent
          mode="scan"
          currentPath={props.tempDrawerProjectRootInput || '/'}
          currentScanPaths={localScanPaths}
          onPathChange={() => {}}
          onScanPathsChange={setLocalScanPaths}
        />
      </CustomDrawer>

      <InstructionEditorDrawer open={isAiInstructionDrawerOpen} onClose={() => setIsAiInstructionDrawerOpen(false)} type="ai" />
      <InstructionEditorDrawer open={isExpectedOutputDrawerOpen} onClose={() => setIsExpectedOutputDrawerOpen(false)} type="expected" />

      <SystemConfigWrapper open={isSystemConfigDrawerOpen} onClose={() => setIsSystemConfigDrawerOpen(false)} />

      {props.plan && (
        <PlanMetadataEditorDrawer
          open={isPlanMetadataEditorOpen}
          onClose={() => setIsPlanMetadataEditorOpen(false)}
          initialTitle={props.plan.title}
          initialSummary={props.plan.summary}
          initialThoughtProcess={props.plan.thoughtProcess}
          initialDocumentation={props.plan.documentation}
          initialAssumptions={props.plan.assumptions}
          initialConfidence={props.plan.confidence}
          initialEstimatedEffortMinutes={props.plan.estimatedEffortMinutes}
          initialBuildScripts={props.plan.buildScripts}
          initialGitInstructions={props.plan.gitInstructions}
          onSave={(d) => {
            // handled by hook via updateCurrentPlanMetadata; keep here for completeness
            if (props.setIsPlanMetadataEditorOpen) props.setIsPlanMetadataEditorOpen(false);
          }}
        />
      )}

      {editingFileChange && (
        <FileChangeEditorDrawer
          open={isFileChangeEditorOpen}
          onClose={() => setIsFileChangeEditorOpen(false)}
          initialFileChange={editingFileChange}
          onSave={() => setIsFileChangeEditorOpen(false)}
        />
      )}

      <CustomDrawer
        open={isPlannerListDrawerOpen}
        onClose={() => setIsPlannerListDrawerOpen(false)}
        position="left"
        size="medium"
        title="All AI Plans"
        hasBackdrop={false}
        footerActionButton={plannerListDrawerActions}
      >
        <PlannerList onClose={() => setIsPlannerListDrawerOpen(false)} />
      </CustomDrawer>

      <CustomDrawer
        open={isErrorDetailsDrawerOpen}
        onClose={() => setIsErrorDetailsDrawerOpen(false)}
        position="left"
        size="medium"
        title="Error Details"
        hasBackdrop={true}
        footerActionButton={errorDrawerActions}
      >
        <ErrorDetailsDrawerContent plan={props.plan || props.error} error={props.error} />
      </CustomDrawer>
    </>
  );
};

export default PlanDrawers;

