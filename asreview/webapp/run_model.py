# Copyright 2019-2022 The ASReview Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
import logging
import sys
from pathlib import Path

from filelock import FileLock
from filelock import Timeout

from asreview.models.balance import get_balance_model
from asreview.models.classifiers import get_classifier
from asreview.models.feature_extraction import get_feature_model
from asreview.models.query import get_query_model
from asreview.project import ASReviewProject
from asreview.project import open_state
from asreview.review.base import BaseReview
from asreview.webapp.io import read_data


def train_model(project):
    """Add the new labels to the review and do the modeling.

    It uses a lock to ensure only one model is running at the same time.
    """

    logging.info(f"Project {project.project_path} - Train a new model for project")

    # Lock so that only one training run is running at the same time.
    lock = FileLock(Path(project.project_path, "training.lock"), timeout=0)

    with lock:

        # Check if there are new labeled records.
        with open_state(project.project_path) as state:
            exist_new_labeled_records = state.exist_new_labeled_records

        if exist_new_labeled_records:
            # collect command line arguments and pass them to the reviewer
            as_data = read_data(project)

            with open_state(project) as state:
                settings = state.settings

            classifier_model = get_classifier(settings.model)
            query_model = get_query_model(settings.query_strategy)
            balance_model = get_balance_model(settings.balance_strategy)
            feature_model = get_feature_model(settings.feature_extraction)

            reviewer = BaseReview(
                as_data,
                project,
                model=classifier_model,
                query_model=query_model,
                balance_model=balance_model,
                feature_model=feature_model,
                **kwargs,
            )

            # Train the model.
            reviewer.train()


def main(argv):
    # parse arguments
    parser = argparse.ArgumentParser()
    parser.add_argument("project_path", type=str, help="Project id")
    parser.add_argument(
        "--output_error",
        dest="output_error",
        action="store_true",
        help="Save training error message to file.",
    )
    parser.add_argument(
        "--first_run",
        dest="first_run",
        action="store_true",
        help="After first run, status is updated.",
    )
    args = parser.parse_args(argv)

    project = ASReviewProject(args.project_path)

    try:
        train_model(project)

        # change the project status to review
        project.update_review(status="review")

    except Timeout:
        logging.debug("Another iteration is training")

    except Exception as err:
        # save the error to the project
        project.set_error(err, save_error_message=args.output_error)

        # raise the error for full traceback
        raise err
    else:
        project.update_review(status="review")


if __name__ == "__main__":
    main(sys.argv)
