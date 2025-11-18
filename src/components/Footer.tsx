import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@nanostores/react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

const Footer = () => {
  const theme = useTheme();

  return (
    <>
      <Box className="flex justify-between items-center w-full">
        <Box className="flex justify-start items-center flex-grow "></Box>
        <Box className="flex justify-end items-center w-1/2 max-w-[600px] pr-4">
          <Box className="flex items-center flex-shrink"></Box>
          <IconButton
            color="inherit"
            aria-label="open output logger"
          ></IconButton>
          <IconButton color="inherit" aria-label="open terminal"></IconButton>
        </Box>
      </Box>
    </>
  );
};
export default Footer;
