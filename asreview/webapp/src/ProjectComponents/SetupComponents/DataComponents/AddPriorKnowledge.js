import * as React from "react";
import { useQuery, useQueryClient } from "react-query";
import { connect } from "react-redux";
import {
  Box,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";

import { AppBarWithinDialog } from "../../../Components";
import { InfoCard, SavingStateBox } from "../../SetupComponents";
import { PriorLabeled, PriorRandom, PriorSearch } from "../DataComponents";
import { ProjectAPI } from "../../../api/index.js";
import { useToggle } from "../../../hooks/useToggle";
import { mapStateToProps } from "../../../globals.js";

const PREFIX = "AddPriorKnowledge";

const classes = {
  form: `${PREFIX}-form`,
  layout: `${PREFIX}-layout`,
  method: `${PREFIX}-method`,
  unlabeled: `${PREFIX}-unlabeled`,
};

const StyledDialog = styled(Dialog)(({ theme }) => ({
  height: "100%",
  overflowY: "hidden",
  [`& .${classes.form}`]: {
    height: "inherit",
    display: "flex",
    overflowY: "hidden",
    padding: 0,
  },

  [`& .${classes.layout}`]: {
    width: "100%",
    flexDirection: "row",
    [`${theme.breakpoints.down("md")} and (orientation: portrait)`]: {
      flexDirection: "column",
    },
  },

  [`& .${classes.method}`]: {
    padding: "24px 32px",
    [theme.breakpoints.down("md")]: {
      padding: "24px",
    },
  },

  [`& .${classes.unlabeled}`]: {
    backgroundColor: "transparent",
    height: "100%",
    width: "50%",
    [`${theme.breakpoints.down("md")} and (orientation: portrait)`]: {
      height: "50%",
      width: "100%",
    },
  },
}));

const AddPriorKnowledge = (props) => {
  const queryClient = useQueryClient();

  const [search, toggleSearch] = useToggle();
  const [random, toggleRandom] = useToggle();

  const { data } = useQuery(
    ["fetchLabeledStats", { project_id: props.project_id }],
    ProjectAPI.fetchLabeledStats,
    {
      enabled: props.project_id !== null,
      refetchOnWindowFocus: false,
    },
  );

  const isEnoughPriorKnowledge = () => {
    return data?.n_prior_exclusions > 4 && data?.n_prior_inclusions > 4;
  };

  const isSavingPriorKnowledge = () => {
    return (
      queryClient.isMutating({ mutationKey: "mutatePriorKnowledge" }) ||
      queryClient.isMutating({ mutationKey: "mutateLabeledPriorKnowledge" })
    );
  };

  const handleClickClose = () => {
    props.toggleAddPrior();
    if (random) {
      toggleRandom();
    }
    if (search) {
      toggleSearch();
    }
  };

  return (
    <StyledDialog
      hideBackdrop
      open={props.open}
      fullScreen={props.mobileScreen}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: { height: !props.mobileScreen ? "calc(100% - 96px)" : "100%" },
      }}
      TransitionComponent={Fade}
    >
      {props.mobileScreen && (
        <AppBarWithinDialog
          onClickStartIcon={handleClickClose}
          startIconIsClose={false}
          title="Prior knowledge"
        />
      )}
      {!props.mobileScreen && (
        <Stack className="dialog-header" direction="row">
          <DialogTitle>Prior knowledge</DialogTitle>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            {isEnoughPriorKnowledge() && (
              <Typography variant="body2" sx={{ color: "secondary.main" }}>
                Enough prior knowledge. Click CLOSE to move on to the next step.
              </Typography>
            )}
            {data?.n_prior !== 0 && (
              <SavingStateBox isSaving={isSavingPriorKnowledge()} />
            )}
            <Box className="dialog-header-button right">
              <Button
                variant={!isEnoughPriorKnowledge() ? "text" : "contained"}
                onClick={handleClickClose}
              >
                Close
              </Button>
            </Box>
          </Stack>
        </Stack>
      )}
      <DialogContent className={classes.form}>
        <Stack className={classes.layout}>
          <Card
            elevation={0}
            square
            variant="outlined"
            className={classes.unlabeled}
          >
            {!search && !random && (
              <Stack className={classes.method} spacing={2}>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Label at least 1 relevant and 1 irrelevant record to warm up
                  the AI.{" "}
                  <Link
                    underline="none"
                    href="https://asreview.readthedocs.io/en/latest/project_create.html#select-prior-knowledge"
                    target="_blank"
                  >
                    Learn more
                  </Link>
                </Typography>
                <InfoCard info="Editing prior knowledge does not train the model" />
                <Typography
                  variant="subtitle1"
                  sx={{ color: "text.secondary" }}
                >
                  Select a way to add prior knowledge:
                </Typography>
                <List>
                  <ListItem disablePadding divider>
                    <Tooltip title="Search for specific records in the dataset">
                      <ListItemButton onClick={toggleSearch}>
                        <ListItemText primary="Search" />
                        <AddIcon color="primary" />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  <ListItem disablePadding divider>
                    <Tooltip title="Get random records from the dataset">
                      <ListItemButton onClick={toggleRandom}>
                        <ListItemText primary="Random" />
                        <AddIcon color="primary" />
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                </List>
              </Stack>
            )}
            {search && !random && (
              <PriorSearch
                n_prior={data?.n_prior}
                toggleSearch={toggleSearch}
              />
            )}
            {!search && random && (
              <PriorRandom
                toggleRandom={toggleRandom}
                toggleSearch={toggleSearch}
              />
            )}
          </Card>
          <Card
            elevation={0}
            square
            variant="outlined"
            className={classes.unlabeled}
          >
            <PriorLabeled
              priorLabeledStats={data}
              mobileScreen={props.mobileScreen}
            />
          </Card>
        </Stack>
      </DialogContent>
    </StyledDialog>
  );
};

export default connect(mapStateToProps)(AddPriorKnowledge);
