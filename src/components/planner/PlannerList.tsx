import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip, // Added Tooltip
  Link // Imported Link
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { plannerService } from './api/plannerService';
import type { IPlannerListItem, IPaginatedPlansResponse } from './types';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import VisibilityIcon from '@mui/icons-material/Visibility'; // Imported Icon

// Add styling for the sticky pagination container
const STICKY_FOOTER_SX = {
    position: 'sticky', // This might need adjustment based on parent context if true viewport sticky is needed, but for component internal sticky footer, this combined with flex layout should work.
    bottom: 0, // Set bottom 0
    zIndex: 10, // Ensure it's above content if scrolling
    backgroundColor: 'inherit', // Inherit background or set to paper/background.default
    padding: 2, // Add some padding
};

type PlannerListProps = {
    onClose?: () => void; // Accept onClose handler from parent drawer
};

const TABLE_HEAD_CELL_STYLE = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper',
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const PlannerList: React.FC<PlannerListProps> = ({ onClose }) => { // Destructure onClose
  const { isLoggedIn } = useStore(authStore);
  const [plans, setPlans] = useState<IPlannerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // Default page size, removed setPageSize as it was unused
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  const fetchPlans = useCallback(async () => {
    if (!isLoggedIn) {
      setError('You must be logged in to view plans.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response: IPaginatedPlansResponse = await plannerService.getPaginatedPlans(
        page,
        pageSize,
      );
      setPlans(response.items);
      // Removed totalItems as it was unused
      setTotalPages(response.totalPages);
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      setError((err as Error).message || 'Failed to fetch plans.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isLoggedIn]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewPlan = useCallback((planId: string) => {
    if (onClose) {
        onClose(); // Close drawer immediately upon initiating navigation
    }
    navigate(`/planner-generator/${planId}`);
  }, [navigate, onClose]);

  // Ensure the component container is structured for sticky footer
  return (
    <Box className="flex flex-col h-full max-h-[calc(100vh-120px)] min-h-[400px]"> 


      {!isLoggedIn && (
        <Alert severity="warning" sx={{ mb: 3, flexShrink: 0 }}>
          You are not logged in. Please log in to view plans.
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3, flexShrink: 0 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && plans.length === 0 && (isLoggedIn ? (
        <Alert severity="info" sx={{ flexShrink: 0 }}>No plans found. Start generating new plans!</Alert>
      ) : (
        <Alert severity="info" sx={{ flexShrink: 0 }}>Login to see your plans.</Alert>
      ))}

      {!loading && !error && plans.length > 0 && (
        <Paper className="flex-grow overflow-hidden flex flex-col mb-0" sx={{ width: '100%' }}> 
          {/* Table Container must grow to fill available space and handle scrolling */}
          <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}> 
            <Table stickyHeader aria-label="planner list table">
              <TableHead>
                <TableRow>
                  <TableCell sx={TABLE_HEAD_CELL_STYLE}>Title</TableCell>
                  <TableCell sx={TABLE_HEAD_CELL_STYLE}>Summary</TableCell>
                  <TableCell sx={TABLE_HEAD_CELL_STYLE}>Created At</TableCell>
                  <TableCell sx={TABLE_HEAD_CELL_STYLE}>Last Status</TableCell>
                  <TableCell sx={TABLE_HEAD_CELL_STYLE}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id} hover>
                    <TableCell>
                      <Link
                        // Component={RouterLink} is replaced by onClick logic handling navigation
                        component="button" // Change component to button to use onClick
                        onClick={() => handleViewPlan(plan.id)}
                        color="primary"
                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' }, cursor: 'pointer' }}
                      >
                        {plan.title}
                      </Link>
                    </TableCell>
                    <TableCell>{plan.summary || '-'}</TableCell>
                    <TableCell>{format(new Date(plan.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>{plan.lastExecutionStatus || '-'}</TableCell>
                    <TableCell>
                      {/* ACTION BUTTON RENDERED AS ICON ONLY */}
                      <Tooltip title="View/Edit Plan" arrow>
                        <IconButton
                          // component={RouterLink}
                          onClick={() => handleViewPlan(plan.id)} // Use custom handler
                          color="secondary"
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {/* Pagination Control - Now structured to be sticky at the bottom of the Paper/TableContainer context */}
          <Box sx={STICKY_FOOTER_SX} className="flex justify-center flex-shrink-0">
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default PlannerList;
