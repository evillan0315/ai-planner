import React from 'react';
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
} from '@mui/material';
import PlanChangeTableRow from './PlanChangeTableRow';
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
}) => {
  if (changes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
        No file changes proposed.
      </Typography>
    );
  }

  return (
    <Box sx={{ px: 0 }}> {/* Use Box wrapper to control padding/margins if needed */}
        <TableContainer sx={tableContainerSx} className="max-h-[400px] shadow-none">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={tableHeadCellSx}>File Path</TableCell>
                <TableCell sx={tableHeadCellSx}>Action</TableCell>
                <TableCell sx={tableHeadCellSx}>Reason</TableCell>
                <TableCell sx={tableHeadCellSx} align="center" width="120px">
                  Actions
                </TableCell>
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
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </Box>
  );
};

export default PlanFileChangesTable;
