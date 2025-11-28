import React, { useMemo } from 'react';
import {
  TableRow,
  TableCell,
  Chip,
  Tooltip,
  CircularProgress,
  SxProps,
  Box,
  Checkbox
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import EditIcon from '@mui/icons-material/Edit';
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer';
import GlobalActionButton, { GlobalAction } from '@/components/ui/GlobalActionButton';
import type { IFileChange } from '@/components/planner/types';

type ChangeApplyStatus = 'idle' | 'applying' | 'success' | 'failure';

export interface PlanChangeTableRowProps {
  change: IFileChange;
  index: number;
  status: ChangeApplyStatus;
  onApplySingleChange: (index: number) => void;
  onEditFileChange: (index: number, change: IFileChange) => void;
  // NEW PROPS
  isSelected: boolean;
  onSelectChange: (index: number, isSelected: boolean) => void;
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
  // NEW PROPS
  isSelected,
  onSelectChange,
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

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectChange(index, event.target.checked);
  };

  const actions = useMemo(() => {
    const actionList: GlobalAction[] = [];
    
    // 1. Apply / Status Action
    if (status === 'applying') {
        actionList.push({
            label: 'Applying...', // Used for Tooltip
            component: <CircularProgress size={20} color="primary" sx={{ display: 'block', margin: 'auto' }} />,
        });
    } else if (status === 'success') {
        actionList.push({
            label: 'Applied successfully',
            component: (
                <Tooltip title="Applied successfully" placement="top">
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                </Tooltip>
            ),
        });
    } else {
        // Idle/Failure state: Apply button
        actionList.push({
            label: status === 'failure' ? 'Retry Apply' : 'Apply this change',
            action: () => onApplySingleChange(index),
            icon: <RocketLaunchIcon fontSize="small" />,
            color: status === 'failure' ? 'error' : 'primary',
            iconOnly: true,
        });
    }

    // 2. Edit Action
    actionList.push({
        label: 'Edit this change',
        action: () => onEditFileChange(index, change),
        icon: <EditIcon fontSize="small" />,
        color: 'secondary',
        iconOnly: true,
    });
    
    return actionList;
  }, [status, index, change, onApplySingleChange, onEditFileChange]);

  return (
    <TableRow key={index} hover>
      {/* NEW: Selection Checkbox */}
      <TableCell padding="checkbox">
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          size="small"
        />
      </TableCell>
      <TableCell
        align="center"
        sx={
          {
          display: 'flex',
          gap: 0.5,
          alignItems: 'center',
          justifyContent: 'center',
        }
        }
      >
        <GlobalActionButton globalActions={actions} iconOnly={true} />
      </TableCell>
      <TableCell className="truncate nowrap max-w-sm">
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
      
    </TableRow>
  );
};

export default PlanChangeTableRow;
