import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SxProps,
  Checkbox,
  Tooltip,
} from '@mui/material';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PlanChangeTableRow from './PlanChangeTableRow';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';
import type { IFileChange } from './types';

type ChangeApplyStatus = 'idle' | 'applying' | 'success' | 'failure';

interface FileChangeStatus {
    status: ChangeApplyStatus;
    error: string | null;
}

interface PlanFileChangesTableProps {
  changes: IFileChange[];
  individualChangeStatus: Map<number, FileChangeStatus>;
  onApplySingleChange: (index: number) => void;
  onEditFileChange: (index: number, fileChange: IFileChange) => void;
  // NEW PROPS
  selectedChangeIndices: Set<number>;
  onToggleChangeSelection: (index: number, isSelected: boolean) => void;
  onToggleAllSelection: (selectAll: boolean) => void;
}



const tableContainerSx: SxProps = {
  borderRadius: '8px',
  overflowY: 'auto',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
};

const tableHeadCellSx: SxProps = {
  fontWeight: 'bold',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
};


const PlanFileChangesTable: React.FC<PlanFileChangesTableProps> = ({
  changes,
  individualChangeStatus,
  onApplySingleChange,
  onEditFileChange,
  // NEW PROPS
  selectedChangeIndices,
  onToggleChangeSelection,
  onToggleAllSelection,
}) => {
  if (changes.length === 0) {

    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No file changes proposed.
      </Typography>
    );
  }

  const selectedCount = selectedChangeIndices.size;
  const totalCount = changes.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  
  const toggleActions: GlobalAction[] = useMemo(() => {
      const actions: GlobalAction[] = [];

      if (selectedCount > 0) {
          // Deselect All
          actions.push({
              label: `Deselect All (${selectedCount})`,
              action: () => onToggleAllSelection(false),
              icon: <ClearAllIcon fontSize='small' />,
              color: 'secondary',
              iconOnly: false,
              size: 'small',
          });
      }
      
      if (!isAllSelected) {
          // Select All
           actions.push({
              label: `Select All (${totalCount})`,
              action: () => onToggleAllSelection(true),
              icon: <SelectAllIcon fontSize='small' />,
              color: selectedCount > 0 ? 'inherit' : 'primary', 
              iconOnly: false,
              size: 'small',
              disabled: totalCount === 0,
          });
      }
      
      return actions.filter(Boolean);
  }, [selectedCount, totalCount, isAllSelected, onToggleAllSelection]);


  return (
    <Box sx={{ px: 0 }}> {/* Use Box wrapper to control padding/margins if needed */}
        {/* Selection Controls and Count */}
        <Box className="flex items-center justify-between p-2">
            <Typography variant="body2" color="text.secondary">
                Selected: <span className='font-bold text-primary-main'>{selectedCount}</span> / {totalCount} changes
            </Typography>
            <GlobalActionButton globalActions={toggleActions} />
        </Box>

        
        <TableContainer sx={tableContainerSx} className="max-h-[400px] shadow-none">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {/* NEW: Checkbox Header Cell for Select All/Indeterminate State */}
                <TableCell sx={tableHeadCellSx} padding="checkbox">
                    <Tooltip title={isAllSelected ? 'Deselect All' : selectedCount > 0 ? `Deselect All (${selectedCount})` : 'Select All'}>
                        <Checkbox 
                            size="small"
                            checked={isAllSelected}
                            indeterminate={selectedCount > 0 && selectedCount < totalCount}
                            onChange={(e) => onToggleAllSelection(e.target.checked)}
                            disabled={totalCount === 0}
                        />
                    </Tooltip>
                </TableCell>
                <TableCell sx={tableHeadCellSx} align="center" width="120px">
                  Actions
                </TableCell>
                <TableCell sx={tableHeadCellSx}>File Path</TableCell>
                <TableCell sx={tableHeadCellSx}>Action</TableCell>
                <TableCell sx={tableHeadCellSx}>Reason</TableCell>
                
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map((change, index) => (
                <PlanChangeTableRow
                  key={index}
                  index={index}
                  change={change}
                  status={individualChangeStatus.get(index)?.status || 'idle'}
                  onApplySingleChange={onApplySingleChange}
                  onEditFileChange={onEditFileChange}
                  // NEW PROPS
                  isSelected={selectedChangeIndices.has(index)}
                  onSelectChange={onToggleChangeSelection}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </Box>
  );
};

export default PlanFileChangesTable;
