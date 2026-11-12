// ABOUTME: Tests for the HistorySheet and HistorySparkline components
// ABOUTME: Verifies the sheet opens from its trigger and lists every year, gaps and SAT years included

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import HistorySheet from './HistorySheet';
import HistorySparkline from './HistorySparkline';
import { yearSeries } from '@/lib/history';

const ACT = yearSeries({ yr_2026: 18.1, yr_2025: 17.9, yr_2019: 19.6, yr_2017: 21.4, yr_2010: 22.5 });

describe('HistorySheet', () => {
  it('stays closed until its trigger is pressed', () => {
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score">
        <button type="button">See every year</button>
      </HistorySheet>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('lists every year, newest first', async () => {
    const user = userEvent.setup();
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score">
        <button type="button">See every year</button>
      </HistorySheet>
    );

    await user.click(screen.getByRole('button', { name: 'See every year' }));

    const dialog = screen.getByRole('dialog', { name: 'Average ACT' });
    const rows = within(dialog).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(17);
    expect(rows[0]).toHaveTextContent('2026');
    expect(rows[0]).toHaveTextContent('18.1');
    expect(rows[16]).toHaveTextContent('2010');
    expect(rows[16]).toHaveTextContent('22.5');
  });

  it('marks years without a value', async () => {
    const user = userEvent.setup();
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score">
        <button type="button">See every year</button>
      </HistorySheet>
    );

    await user.click(screen.getByRole('button', { name: 'See every year' }));

    expect(screen.getByRole('row', { name: /2020/ })).toHaveTextContent('No data');
  });

  it('marks SAT years that have a value when asked to', async () => {
    const user = userEvent.setup();
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score" satYears>
        <button type="button">See every year</button>
      </HistorySheet>
    );

    await user.click(screen.getByRole('button', { name: 'See every year' }));

    expect(screen.getByRole('row', { name: /2019/ })).toHaveTextContent('SAT, converted');
    expect(screen.getByRole('row', { name: /2020/ })).not.toHaveTextContent('SAT, converted');
    expect(screen.getByRole('row', { name: /2025/ })).not.toHaveTextContent('SAT, converted');
  });

  it('shows the chart unless told not to', async () => {
    const user = userEvent.setup();
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score" chart={false}>
        <button type="button">See every year</button>
      </HistorySheet>
    );

    await user.click(screen.getByRole('button', { name: 'See every year' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('can be closed', async () => {
    const user = userEvent.setup();
    render(
      <HistorySheet title="Average ACT" series={ACT} kind="score">
        <button type="button">See every year</button>
      </HistorySheet>
    );

    await user.click(screen.getByRole('button', { name: 'See every year' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('HistorySparkline', () => {
  it('opens the full chart and year table', async () => {
    const user = userEvent.setup();
    render(<HistorySparkline label="Low income" series={yearSeries({ yr_2026: 35.2, yr_2010: 26 })} kind="percentage" />);

    await user.click(screen.getByRole('button', { name: 'Low income history' }));

    const dialog = screen.getByRole('dialog', { name: 'Low income' });
    expect(within(dialog).getByRole('img', { name: /^Low income from 2010 to 2026/ })).toBeInTheDocument();
    expect(within(dialog).getByRole('row', { name: /2026/ })).toHaveTextContent('35.2%');
  });

  it('renders nothing with fewer than two reported years', () => {
    const { container } = render(
      <HistorySparkline label="Low income" series={yearSeries({ yr_2026: 35.2 })} kind="percentage" />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
