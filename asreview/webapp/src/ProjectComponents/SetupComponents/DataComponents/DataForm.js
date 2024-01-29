import * as React from "react";
import { useQuery } from "react-query";
import { connect } from "react-redux";
import {
  Box,
  CircularProgress,
  Link,
  Stack,
  Typography,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { InlineErrorHandler } from "../../../Components";
import { DataFormCard } from "../DataComponents";
import { ProjectAPI } from "../../../api/index.js";
import { mapStateToProps } from "../../../globals.js";
import { SelectItem } from "../../../ProjectComponents";

const PREFIX = "DataForm";

const classes = {
  title: `${PREFIX}-title`,
  loading: `${PREFIX}-loading`,
};

const Root = styled("div")(({ theme }) => ({
  [`& .${classes.title}`]: {
    paddingBottom: 24,
  },

  [`& .${classes.loading}`]: {
    display: "flex",
    justifyContent: "center",
  },
}));

const DataForm = (props) => {
  const [priorMethod, setPriorMethod] = React.useState("prior_knowledge");

  const { data, error, isError, isFetching, refetch } = useQuery(
    ["fetchLabeledStats", { project_id: props.project_id }],
    ProjectAPI.fetchLabeledStats,
    {
      enabled: props.project_id !== null,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data.n_prior_inclusions !== 0 && data.n_prior_exclusions !== 0) {
          props.handleComplete(true);
        } else {
          props.handleComplete(false);
        }
      },
    },
  );

  const handlePriorMethod = (event) => {
    setPriorMethod(event.target.value);
  };

  const priorAdded = () => {
    return data?.n_inclusions !== 0 && data?.n_exclusions !== 0;
  };

  return (
    <Root>
      <Box className={classes.title}>
        <Typography variant="h6">Model warmup</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {/* {Description} */}
        </Typography>
      </Box>
      {!isFetching && isError && (
        <InlineErrorHandler
          message={error?.message}
          refetch={refetch}
          button={true}
        />
      )}
      {!isFetching && isError && (
        <InlineErrorHandler message={error?.message} refetch={refetch} button />
      )}
      <Stack direction="column" spacing={3}>
        <FormControl fullWidth variant={"outlined"}>
          <InputLabel id="prior-select-label">Model</InputLabel>
          <Select
            labelId="prior-select-label"
            id="prior-select"
            // inputProps={{
            //   onFocus: () => props.onFocus(),
            //   onBlur: () => props.onBlur(),
            // }}
            name="prior"
            label="Model warmup method"
            value={priorMethod}
            onChange={handlePriorMethod}
          >
            {/* iterater over the default models */}
            <MenuItem
              value={"prior_knowledge"}
              key={`result-item-prior-knowledge`}
              divider
            >
              <SelectItem
                primary={"Prior knowledge"}
                secondary={
                  "Label at least 1 relevant and 1 irrelevant record to warm up the AI"
                }
              />
            </MenuItem>
            <MenuItem
              value={"start_random"}
              key={`result-item-start-random`}
              divider
            >
              <SelectItem
                primary={"Start random"}
                secondary={
                  "Screen randomly till the first relevant record is found"
                }
              />
            </MenuItem>
            <MenuItem
              value={"review_criteria"}
              key={`result-item-review-criteria`}
              divider
            >
              <SelectItem
                primary={"Review criteria"}
                secondary={
                  "Provide a list of criteria or keywords to screen by"
                }
              />
            </MenuItem>
          </Select>
          {false && (
            <FormHelperText style={{ fontSize: "16px" }}>Extra</FormHelperText>
          )}
        </FormControl>

        {priorMethod === "prior_knowledge" && (
          <DataFormCard
            added={priorAdded()}
            primaryDefault="Add prior knowledge"
            secondaryDefault="Label at least 1 relevant and 1 irrelevant record to warm up the AI"
            secondaryAdded={`${data?.n_prior_inclusions} relevant and ${data?.n_prior_exclusions} irrelevant records`}
            toggleAddCard={props.toggleAddPrior}
          />
        )}

        {priorMethod === "start_random" && (
          <Typography>
            This option does not require any prior knowledge. The AI will start
            screening randomly until the first relevant record is found. This
            will be used to train the AI. After that, the AI will start
            screening based on the model you selected. In datasets with a low
            percentage of relevant records, this option may be slow.
          </Typography>
        )}

        {priorMethod === "review_criteria" && (
          <Box sx={{ width: "100%" }}>
            <Typography>
              This option provides a list of criteria or keywords to screen by.
            </Typography>
            <FormControl>
              <TextField
                required
                id="relevant-field"
                label="Relevant"
                // inputProps={{
                //   onFocus: () => onFocus(),
                //   onBlur: () => onBlur(),
                // }}
                multiline
                minRows={8}
                onChange={() => {}}
              />
              <TextField
                fullWidth
                required
                id="irrelevant-field"
                label="Irrelevant"
                // inputProps={{
                //   onFocus: () => onFocus(),
                //   onBlur: () => onBlur(),
                // }}
                multiline
                minRows={8}
                onChange={() => {}}
              />
            </FormControl>
          </Box>
        )}
      </Stack>
    </Root>
  );
};

export default connect(mapStateToProps)(DataForm);
