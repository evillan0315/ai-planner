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
} from '@mui/material';
import { useStore } from '@nanostores/react';
import { authStore } from '@/stores/authStore';
import { plannerService } from './api/plannerService';
import type { IPlannerListItem, IPaginatedPlansResponse } from './types';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link'; // Import MUI Link for styling if needed
import { format } from 'date-fns';

type PlannerListProps = Record<string, never>; // To address @typescript-eslint/no-empty-object-type

const TABLE_HEAD_CELL_STYLE = {
  fontWeight: 'bold',
  backgroundColor: 'background.paper',
  borderBottom: '1px solid',
  borderColor: 'divider',
};

const PlannerList: React.FC<PlannerListProps> = () => {
  const { isLoggedIn } = useStore(authStore);
  const [plans, setPlans] = useState<IPlannerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // Default page size, removed setPageSize as it was unused
  const [totalPages, setTotalPages] = useState(0);

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

  return (
    <Box className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col h-full"> 
      <Typography variant="h4" component="h1" gutterBottom className="font-bold text-primary-main mb-6"> 
        Existing AI Plans
      </Typography>

      {!isLoggedIn && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You are not logged in. Please log in to view plans.
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && plans.length === 0 && (isLoggedIn ? (
        <Alert severity="info">No plans found. Start generating new plans!</Alert>
      ) : (
        <Alert severity="info">Login to see your plans.</Alert>
      ))}

      {!loading && !error && plans.length > 0 && (
        <Paper className="flex-grow" sx={{ width: '100%', mb: 3, display: 'flex', flexDirection: 'column' }}> 
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
                        component={RouterLink}
                        to={`/planner-generator/${plan.id}`}
                        color="primary"
                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        {plan.title}
                      </Link>
                    </TableCell>
                    <TableCell>{plan.summary || '-'}</TableCell>
                    <TableCell>{format(new Date(plan.createdAt), 'yyyy-MM-dd HH:mm')}</TableCell>
                    <TableCell>{plan.lastExecutionStatus || '-'}</TableCell>
                    <TableCell>
                      <Link
                        component={RouterLink}
                        to={`/planner-generator/${plan.id}`}
                        color="secondary"
                        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                      >
                        View/Edit
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box className="flex justify-center p-4 flex-shrink-0"> 
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
