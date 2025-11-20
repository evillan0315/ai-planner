import React from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  SxProps,
  Box
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditIcon from '@mui/icons-material/Edit';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import type { IFileChange } from '@/components/planner/types';

type ChangeApplyStatus = 'idle' | 'applying' | 'success' | 'failure';

interface PlanChangeTableRowProps {
  change: IFileChange;
  index: number;
  status: ChangeApplyStatus;
  onApplySingleChange: (index: number) => void;
  onEditFileChange: (index: number, change: IFileChange) => void;
}

const reasonRendererSx: SxProps = {
  p: 0,
  '& p, & ul, & ol': { m: 0, p: 0 }, // Remove margins/padding from paragraphs and lists
  '& ul, & ol': { pl: 2 }, // Add back padding for list items
};

const PlanChangeTableRow: React.FC<PlanChangeTableRowProps> = ({
  change,
  index,
  status,
  onApplySingleChange,
  onEditFileChange,
}) => {
  const getChipColor = (action: IFileChange['action']) => {
    switch (action) {
      case 'ADD':
        return 'success';
      case 'MODIFY':
      case 'REPAIR':
        return 'info';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableRow key={index} hover>
      <TableCell className="truncate nowrap max-w-[100px]">
        <Tooltip title={change.filePath}>
          {change.filePath}
        </Tooltip>
      </TableCell>
      <TableCell>
        <Chip label={change.action} color={getChipColor(change.action)} size="small" />
      </TableCell>
      <TableCell>
        {change.reason ? (
        
          <Tooltip title={<MarkdownRenderer content={change.reason} sx={reasonRendererSx} />}>
            <Box className="truncate nowrap max-w-xs">
            {change.reason}
            </Box>
          </Tooltip>
        
          
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell
        align="center"
        sx={{
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {status === 'applying' ? (
          <CircularProgress size={20} color="inherit" />
        ) : status === 'success' ? (
          <Tooltip title="Applied successfully">
            <CheckCircleOutlineIcon color="success" fontSize="small" />
          </Tooltip>
        ) : (
          <Tooltip title="Apply this change">
            <IconButton
              onClick={() => onApplySingleChange(index)}
              size="small"
              color="primary"
              aria-label={`apply change ${index}`}
            >
              <RocketLaunchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Edit this change">
          <IconButton
            onClick={() => onEditFileChange(index, change)}
            size="small"
            color="secondary"
            aria-label={`edit change ${index}`}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default PlanChangeTableRow;
