"""Bartlett's transmission chain experiment from Remembering (1932)."""

import logging
# import pysnooper

from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from dallinger.bots import BotBase
from dallinger.config import get_config
from dallinger.networks import Chain
from dallinger.experiment import Experiment


logger = logging.getLogger(__file__)


def extra_parameters():
    config = get_config()
    config.register("num_participants", int)


class Bartlett1932(Experiment):
    """Define the structure of the experiment."""

    def __init__(self, session=None):
        """Call the same function in the super (see experiments.py in dallinger).

        A few properties are then overwritten.

        Finally, setup() is called.
        """
        super(Bartlett1932, self).__init__(session)
        from . import models  # Import at runtime to avoid SQLAlchemy warnings

        self.models = models
        self.experiment_repeats = 1
        self.initial_recruitment_size = self.generation_size = 2
        self.generations = 2
        if session:
            self.setup()

    def configure(self):
        config = get_config()
        self.num_participants = config.get("num_participants")

    def setup(self):
        """Setup the networks.

        Setup only does stuff if there are no networks, this is so it only
        runs once at the start of the experiment. It first calls the same
        function in the super (see experiments.py in dallinger). Then it adds a
        source to each network.
        """
        if not self.networks():
            super(Bartlett1932, self).setup()
            for net in self.networks():
                self.models.WarOfTheGhostsSource(network=net)

    def create_node(self, network, participant):
        return self.models.Particle(network=network,participant=participant)

    def create_network(self):
        """Return a new network."""
        # return Chain(max_size=self.num_participants)
        return self.models.ParticleFilter(generations = self.generations, generation_size = self.generation_size)

    def add_node_to_network(self, node, network):
        """Add node to the chain and receive transmissions."""
        network.add_node(node)
        parents = node.neighbors(direction="from")
        if len(parents):
            parent = parents[0]
            parent.transmit()
        node.receive()

    # @pysnooper.snoop()
    def recruit(self):
        """Recruit one participant at a time until all networks are full."""
        if self.networks(full=False):
            network = self.models.ParticleFilter.query.one()

            completed_participant_ids = [p.id for p in self.models.Participant.query.filter_by(failed = False, status = "approved")]
            
            # particle.property3 = generation
            completed_nodes_this_generation = self.models.Particle.query.filter(
                                                                            self.models.Particle.property3 == repr(int(network.property3)), \
                                                                            self.models.Particle.participant_id.in_(completed_participant_ids)) \
                                                                        .count() 

            if completed_nodes_this_generation == self.generation_size:
                network.current_generation = int(network.current_generation) + 1
                self.recruiter.recruit(n=self.generation_size)

        else:
            self.recruiter.close_recruitment()
