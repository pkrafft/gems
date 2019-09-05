from dallinger.nodes import Source
from dallinger.nodes import Agent
from dallinger.models import Info
from dallinger.models import Network
from dallinger.recruiters import MTurkRecruiter # TODO: is the recruiter fixed?

from sqlalchemy import Integer, String, Float
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.sql.expression import cast

import random
import json

class WarOfTheGhostsSource(Source):
    """A Source that reads in a random story from a file and transmits it."""

    __mapper_args__ = {"polymorphic_identity": "war_of_the_ghosts_source"}

    @hybrid_property
    def source_contents(self):
        """Convert property2 to source_contents."""
        return self.property2

    @source_contents.setter
    def source_contents(self, contents):
        """Make generation settable."""
        self.property2 = contents

    @source_contents.expression
    def source_contents(self):
        """Make generation queryable."""
        return self.property2

    def _contents(self):
        """Define the contents of new Infos.

        transmit() -> _what() -> create_information() -> _contents().
        """

        if self.source_contents is None:

            contents = {}

            # http://www.dialectcreator.com/
            classes = ['luthe','ovuwal','yiathy','oob','bakasho','ese','iydo','imoy']

            n_turns = 20
            n_classes = len(classes)
            n_evidence = 4

            true_prob = 0.6
            false_prob = 0.5

            true_class = random.choice(classes);

            tests = []
            for t in range(n_turns):
                tests += [[]]
                for i in range(n_evidence):
                    tests[t] += [[]]
                    for c in classes:
                        if c == true_class:
                            prob = true_prob
                        else:
                            prob = false_prob
                        if random.random() < prob:
                            tests[t][i] += [c]

            contents['shift'] = 0
            contents['classes'] = classes
            contents['true_class'] = true_class
            contents['tests'] = tests
            contents['choice'] = ''

            contents = json.dumps(contents)

            self.source_contents = contents

        else:

            contents = self.source_contents

        return contents
