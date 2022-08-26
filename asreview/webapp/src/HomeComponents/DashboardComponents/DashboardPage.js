import React from "react";
import { Box, Fab, Fade, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Add } from "@mui/icons-material";

import { ActionsFeedbackBar } from "../../Components";
import { ProjectImportDialog } from "../../ProjectComponents";
import {
  DashboardPageHeader,
  ModePickDialog,
  NumberCard,
  ProjectTable,
} from "../DashboardComponents";
import { SetupDialog } from "../../ProjectComponents/SetupComponents";

import { useToggle } from "../../hooks/useToggle";
import { projectModes } from "../../globals";

const Root = styled("div")(({ theme }) => ({}));

const DashboardPage = (props) => {
  const [onModePick, setOnModePick] = React.useState(false);
  const [selectedMode, setSelectedMode] = React.useState(projectModes.ORACLE);
  const [onImportDialog, toggleImportDialog] = useToggle();
  const [feedbackBar, setFeedbackBar] = React.useState({
    open: false,
    message: null,
  });

  const handleClickCreate = () => {
    setOnModePick(true);
  };

  const handleCloseModePick = (value) => {
    setOnModePick(false);
    if (value) {
      if (value !== "import") {
        setSelectedMode(value);
        props.toggleProjectSetup();
      } else {
        toggleImportDialog();
      }
    }
  };

  const resetFeedbackBar = () => {
    setFeedbackBar({
      ...feedbackBar,
      open: false,
    });
  };

  return (
    <Root aria-label="projects page">
      <Fade in>
        <Box>
          <DashboardPageHeader
            mobileScreen={props.mobileScreen}
            toggleImportDialog={toggleImportDialog}
          />
          <Box className="main-page-body-wrapper">
            <Stack className="main-page-body" spacing={6}>
              <NumberCard mobileScreen={props.mobileScreen} />
              <ProjectTable
                onNavDrawer={props.onNavDrawer}
                projectCheck={props.projectCheck}
                setFeedbackBar={setFeedbackBar}
                setProjectCheck={props.setProjectCheck}
                toggleProjectSetup={props.toggleProjectSetup}
              />
            </Stack>
          </Box>
        </Box>
      </Fade>
      <Fab
        className="main-page-fab"
        color="primary"
        onClick={handleClickCreate}
        variant="extended"
      >
        <Add sx={{ mr: 1 }} />
        Create
      </Fab>
      <ModePickDialog open={onModePick} onClose={handleCloseModePick} />
      <ProjectImportDialog
        mobileScreen={props.mobileScreen}
        open={onImportDialog}
        onClose={toggleImportDialog}
        setFeedbackBar={setFeedbackBar}
      />
      <SetupDialog
        mobileScreen={props.mobileScreen}
        open={props.onProjectSetup}
        onClose={props.toggleProjectSetup}
        selectedMode={selectedMode}
        setFeedbackBar={setFeedbackBar}
      />
      <ActionsFeedbackBar
        center
        onClose={resetFeedbackBar}
        open={feedbackBar.open}
        feedback={feedbackBar.message}
      />
    </Root>
  );
};

export default DashboardPage;
