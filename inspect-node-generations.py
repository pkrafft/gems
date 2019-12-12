# coding: utf-8
# billdthompson@berkeley.edu

import numpy as np
import pandas as pd
import click
import logging
logging.basicConfig(format='%(levelname)s > %(message)s', level=logging.INFO)


@click.command()
@click.option('--nodefile', '-n')
def run(nodefile):
	df = pd.read_csv(nodefile)
	print(df[(df.type == 'particle') & (df.property3 == 2)].groupby(['participant_id']).count()['id'])

if __name__ == '__main__':
    run()